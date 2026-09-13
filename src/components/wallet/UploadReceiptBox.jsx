import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'framer-motion';
import { AlertCircle, FileImage, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';

const GEMINI_SDK_VERSION = '2.12.0';
const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_MODELS = [...new Set([
  import.meta.env.VITE_GEMINI_MODEL,
  GEMINI_MODEL,
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
].map((model) => String(model || '').trim()).filter(Boolean))];
const GEMINI_HTTP_TIMEOUT_MS = 60_000;
const GEMINI_ABORT_TIMEOUT_MS = 65_000;
const GEMINI_API_KEYS = [...new Set([
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
  import.meta.env.VITE_GEMINI_API_KEY_6,
  import.meta.env.VITE_GEMINI_API_KEY_7,
  import.meta.env.VITE_GEMINI_API_KEY_8,
  import.meta.env.VITE_GEMINI_API_KEY_9,
  import.meta.env.VITE_GEMINI_API_KEY_10,
  import.meta.env.VITE_GEMINI_API_KEY_11,
  import.meta.env.VITE_GEMINI_API_KEY_12,
  import.meta.env.VITE_GEMINI_API_KEY_13,
  // Preserve compatibility with the previously configured single-key variable.
  import.meta.env.VITE_GEMINI_API_KEY,
].map((key) => String(key || '').trim()).filter(Boolean))];
const RECEIPT_ERROR = 'يرجى رفع صورة إيصال تحويل أو دفع صحيحة تحتوي على مبلغ واضح.';
const VALIDATION_ERRORS = {
  unsuccessful: 'الصورة لا توضح أن عملية الدفع أو التحويل تمت بنجاح.',
  pending: 'عملية الدفع الظاهرة في الصورة ما زالت قيد الانتظار ولم تكتمل بعد.',
  failed: 'عملية الدفع الظاهرة في الصورة فشلت أو تم رفضها.',
  unclear: 'الصورة غير واضحة أو مقصوصة، يرجى رفع صورة كاملة وواضحة.',
  suspectedEdit: 'تعذر قبول الصورة لوجود مؤشرات على أنها معدلة أو غير أصلية.',
  lowConfidence: 'تعذر التحقق من بيانات الدفع بثقة كافية، يرجى رفع صورة أوضح.',
  amountMissing: 'لم يتم العثور على مبلغ واضح ومقروء داخل الصورة.',
  amountMismatch: 'المبلغ الظاهر في الصورة لا يطابق المبلغ الذي أدخلته.',
  receiverMissing: 'لا توجد بيانات مستلم مهيأة يمكن مطابقتها مع الإيصال.',
  receiverMismatch: 'بيانات المستلم الظاهرة في الصورة لا تطابق وجهة الدفع المطلوبة.',
  transactionMismatch: 'رقم العملية الظاهر في الصورة لا يطابق رقم العملية الذي أدخلته.',
  timeout: 'استغرق التحقق من الصورة وقتًا طويلًا. يرجى المحاولة مرة أخرى.',
  network: 'تعذر الاتصال بخدمة التحقق. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.',
  service: 'خدمة التحقق غير متاحة حاليًا. يرجى المحاولة مرة أخرى لاحقًا.',
  invalidResponse: 'تعذر قراءة نتيجة التحقق من الصورة. يرجى المحاولة بصورة أخرى.',
};
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const receiptSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    valid: { type: 'boolean' },
    success: { type: 'boolean' },
    confidence: { type: 'number' },
    amount: { type: 'string' },
    currency: { type: 'string' },
    paymentMethod: { type: 'string' },
    receiverPhone: { type: 'string' },
    receiverWallet: { type: 'string' },
    receiverUID: { type: 'string' },
    receiverEmail: { type: 'string' },
    receiverName: { type: 'string' },
    receiverWalletAddress: { type: 'string' },
    transactionId: { type: 'string' },
    reason: { type: 'string' },
  },
  required: [
    'valid', 'success', 'confidence', 'amount', 'currency', 'paymentMethod',
    'receiverPhone', 'receiverWallet', 'receiverUID', 'receiverEmail',
    'receiverName', 'receiverWalletAddress', 'transactionId', 'reason',
  ],
};

const toLatinDigits = (value) => String(value ?? '')
  .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

const parsePaymentAmount = (value) => {
  const numeric = toLatinDigits(value).replace(/[^\d.,-]/g, '');
  if (!numeric) return null;

  const lastDot = numeric.lastIndexOf('.');
  const lastComma = numeric.lastIndexOf(',');
  const decimalIndex = Math.max(lastDot, lastComma);
  const decimalDigits = decimalIndex >= 0 ? numeric.length - decimalIndex - 1 : 0;
  const hasBothSeparators = lastDot >= 0 && lastComma >= 0;
  const hasDecimalSeparator = decimalIndex >= 0 && (hasBothSeparators || decimalDigits <= 2);
  const normalized = hasDecimalSeparator
    ? `${numeric.slice(0, decimalIndex).replace(/[.,]/g, '')}.${numeric.slice(decimalIndex + 1)}`
    : numeric.replace(/[.,]/g, '');
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : null;
};

const normalizePhone = (value) => {
  const digits = toLatinDigits(value).replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
};

const normalizeText = (value) => String(value ?? '')
  .normalize('NFKC')
  .trim()
  .toLocaleLowerCase()
  .replace(/[\s\p{P}\p{S}]+/gu, '');

const normalizeExactIdentifier = (value) => String(value ?? '')
  .normalize('NFKC')
  .trim()
  .replace(/\s+/g, '');

const fieldsMatch = (field, extractedValue, configuredValue) => {
  if (!String(extractedValue || '').trim() || !String(configuredValue || '').trim()) return false;
  if (field === 'receiverPhone') return normalizePhone(extractedValue) === normalizePhone(configuredValue);
  if (field === 'receiverEmail' || field === 'receiverName' || field === 'receiverWallet') {
    return normalizeText(extractedValue) === normalizeText(configuredValue);
  }
  return normalizeExactIdentifier(extractedValue) === normalizeExactIdentifier(configuredValue);
};

const getReceiptValidationError = ({
  result,
  extractedAmount,
  amountMatched,
  hasConfiguredReceiver,
  receiverMatched,
  transactionMatched,
}) => {
  const reason = String(result?.reason || '').toLocaleLowerCase();

  if (reason.includes('pending') || reason.includes('قيد الانتظار')) return VALIDATION_ERRORS.pending;
  if (reason.includes('failed') || reason.includes('declined') || reason.includes('rejected')) return VALIDATION_ERRORS.failed;
  if (reason.includes('blurry') || reason.includes('blurred') || reason.includes('cropped') || reason.includes('unclear')) {
    return VALIDATION_ERRORS.unclear;
  }
  if (reason.includes('fake') || reason.includes('edited') || reason.includes('manipulated')) {
    return VALIDATION_ERRORS.suspectedEdit;
  }
  if (result?.valid !== true || result?.success !== true) return VALIDATION_ERRORS.unsuccessful;
  if (Number(result?.confidence) < 90) return VALIDATION_ERRORS.lowConfidence;
  if (extractedAmount === null) return VALIDATION_ERRORS.amountMissing;
  if (!amountMatched) return VALIDATION_ERRORS.amountMismatch;
  if (!hasConfiguredReceiver) return VALIDATION_ERRORS.receiverMissing;
  if (!receiverMatched) return VALIDATION_ERRORS.receiverMismatch;
  if (!transactionMatched) return VALIDATION_ERRORS.transactionMismatch;
  return RECEIPT_ERROR;
};

const getGeminiRequestError = (error, timedOut) => {
  if (timedOut || error?.name === 'AbortError') return VALIDATION_ERRORS.timeout;
  if (error instanceof SyntaxError) return VALIDATION_ERRORS.invalidResponse;

  const status = Number(error?.status ?? error?.response?.status ?? 0);
  if (status === 429 || status >= 500) return VALIDATION_ERRORS.service;
  if (!status || error?.name === 'TypeError') return VALIDATION_ERRORS.network;
  return VALIDATION_ERRORS.service;
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1]);
  reader.onerror = () => reject(new Error('Unable to read image'));
  reader.readAsDataURL(file);
});

const logGeminiError = (error) => {
  if (!import.meta.env.DEV) return;

  const httpStatus = error?.status
    ?? error?.response?.status
    ?? error?.sdkHttpResponse?.status
    ?? null;
  const responseBody = error?.response?.data
    ?? error?.response?.body
    ?? error?.body
    ?? error?.message
    ?? null;

  // Keep the complete SDK error available in development tools for diagnosing API failures.
  console.error('[Gemini] Full error object:', error);
  console.error('[Gemini] HTTP status:', httpStatus);
  console.error('[Gemini] Response body:', responseBody);
};

const getGeminiErrorMetadata = (error) => {
  const status = Number(
    error?.status
    ?? error?.response?.status
    ?? error?.sdkHttpResponse?.status
    ?? error?.error?.code
    ?? 0
  );
  const errorParts = [
    error?.message,
    error?.body,
    error?.error,
    error?.cause?.message,
    error?.response?.data,
    error?.response?.body,
  ];
  const details = errorParts.map((part) => {
    if (typeof part === 'string') return part;
    try {
      return JSON.stringify(part ?? '');
    } catch {
      return String(part ?? '');
    }
  }).join(' ').toLocaleLowerCase();

  return { status, details };
};

const isRetryableGeminiError = (error) => {
  if (error?.name === 'AbortError') return false;

  const { status, details } = getGeminiErrorMetadata(error);
  const retryableStatus = [401, 403, 408, 429, 499, 500, 502, 503, 504].includes(status);
  const retryableDetails = [
    'api_key_invalid',
    'api key not valid',
    'permission_denied',
    'resource_exhausted',
    'quota exceeded',
    'quota_exceeded',
    'rate limit',
    'rate_limit',
    'unavailable',
    'service unavailable',
    'high demand',
    'overloaded',
    'temporarily unavailable',
    'cancelled',
    'canceled',
    'operation was cancelled',
    'operation was canceled',
  ].some((value) => details.includes(value));

  return retryableStatus
    || retryableDetails
    || (!status && (error?.name === 'TypeError' || details.includes('network')));
};

const waitForGeminiRetry = (failureIndex, signal) => new Promise((resolve, reject) => {
  const delay = Math.min(600 * (2 ** Math.min(failureIndex, 2)), 2400)
    + Math.floor(Math.random() * 250);
  const timeoutId = window.setTimeout(() => {
    signal?.removeEventListener('abort', handleAbort);
    resolve();
  }, delay);
  const handleAbort = () => {
    window.clearTimeout(timeoutId);
    const error = new Error('Gemini validation was superseded');
    error.name = 'AbortError';
    reject(error);
  };

  if (signal?.aborted) {
    handleAbort();
    return;
  }
  signal?.addEventListener('abort', handleAbort, { once: true });
});

const generateWithGeminiFailover = async (request, validationSignal) => {
  if (!GEMINI_API_KEYS.length) throw new Error('Missing Gemini API key');

  const attemptCount = Math.max(GEMINI_API_KEYS.length, GEMINI_MODELS.length);
  let lastError = null;

  for (let index = 0; index < attemptCount; index += 1) {
    if (validationSignal?.aborted) {
      const error = new Error('Gemini validation was superseded');
      error.name = 'AbortError';
      throw error;
    }

    const keyIndex = index % GEMINI_API_KEYS.length;
    const model = GEMINI_MODELS[index % GEMINI_MODELS.length];
    const keyNumber = keyIndex + 1;
    const attemptController = new AbortController();
    let timedOut = false;
    const abortAttempt = () => attemptController.abort();
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      attemptController.abort();
    }, GEMINI_ABORT_TIMEOUT_MS);
    validationSignal?.addEventListener('abort', abortAttempt, { once: true });

    if (import.meta.env.DEV) {
      console.info(`[Gemini] Attempt ${index + 1}/${attemptCount}: key ${keyNumber}, model ${model}`);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEYS[keyIndex] });
      const response = await ai.models.generateContent({
        ...request,
        model,
        config: {
          ...request.config,
          abortSignal: attemptController.signal,
        },
      });
      if (import.meta.env.DEV) {
        console.info(`[Gemini] Key ${keyNumber} succeeded with model ${model}`);
      }
      return response;
    } catch (error) {
      if (validationSignal?.aborted) throw error;

      if (timedOut && error?.name === 'AbortError') {
        lastError = new Error(`Gemini request timed out for model ${model}`);
        lastError.name = 'TimeoutError';
      } else {
        lastError = error;
      }

      const canFailOver = (timedOut || isRetryableGeminiError(lastError))
        && index < attemptCount - 1;
      if (!canFailOver) throw lastError;

      if (import.meta.env.DEV) {
        const { status } = getGeminiErrorMetadata(lastError);
        console.warn(
          `[Gemini] Key ${keyNumber} / model ${model} failed${status ? ` (${status})` : ''}; trying the next key/model`
        );
      }
      await waitForGeminiRetry(index, validationSignal);
    } finally {
      window.clearTimeout(timeoutId);
      validationSignal?.removeEventListener('abort', abortAttempt);
    }
  }

  throw lastError || new Error('All Gemini API keys and fallback models failed');
};

const UploadReceiptBox = ({
  onFileUpload,
  paymentAmount,
  transactionId,
  receiverPhone = '',
  receiverWallet = '',
  receiverUID = '',
  receiverEmail = '',
  receiverName = '',
  receiverWalletAddress = '',
}) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isRTL = dir === 'rtl';
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const validationIdRef = useRef(0);
  const activeValidationControllerRef = useRef(null);

  useEffect(() => () => activeValidationControllerRef.current?.abort(), []);

  const maxSize = 20 * 1024 * 1024;

  const validateFile = (file) => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) return t('payments.upload.invalidType');
    if (file.size > maxSize) return t('payments.upload.invalidSize');
    return null;
  };

  const handleFileSelect = async (file) => {
    // Supersede any validation already in flight as soon as a new file is selected.
    activeValidationControllerRef.current?.abort();
    const validationId = ++validationIdRef.current;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError('');
    const validationController = new AbortController();
    activeValidationControllerRef.current = validationController;

    try {
      const imageData = await fileToBase64(file);

      if (import.meta.env.DEV) {
        console.info('[Gemini] SDK version:', GEMINI_SDK_VERSION);
        console.info('[Gemini] Model fallback chain:', GEMINI_MODELS.join(' -> '));
      }

      // Structured output keeps the model response predictable and safely parseable.
      const response = await generateWithGeminiFailover({
        contents: [
          {
            inlineData: {
              data: imageData,
              mimeType: file.type,
            },
          },
          {
            text: `Analyze this image as a payment-proof validator. Return only JSON matching the schema.
The image does NOT need to be a traditional receipt. Treat Vodafone Cash USSD confirmation screens, USSD transfer confirmation dialogs, successful payment confirmation screens, successful bank-transfer screens, crypto-transfer confirmations, and mobile-wallet transfer confirmations as valid payment evidence.
Accept payment methods of any kind (bank transfer, mobile wallet, Vodafone Cash, InstaPay, Binance/Binance Pay, USDT, TRX, or any crypto wallet).
Strong success evidence includes clear confirmation language such as: تم تحويل، تم الإرسال، تم الدفع، تمت العملية بنجاح، نجاح العملية، تحويل ناجح، تم استلام، تم إرسال المبلغ, Transfer Successful, Payment Successful, Transaction Successful, Sent, Completed, Success, or Paid. Consider equivalent wording in any language too.
Set success=true when the image clearly indicates a completed or confirmed money transfer. A USSD popup or dialog is valid evidence and must not be rejected merely because it is a screenshot or is not a receipt. Pending, failed, unclear, chat, gallery, selfie, and unrelated images must be false.
Reject blurry or materially cropped images, unreadable amounts, suspected fake/edited images, and any image whose payment status is not clearly completed.
Extract the visible amount and currency, payment method, transaction ID, and every receiver identifier visible in the image. Put phone numbers in receiverPhone, wallet/account identifiers in receiverWallet, Binance UID in receiverUID, email in receiverEmail, recipient name in receiverName, and crypto destination addresses in receiverWalletAddress. Use an empty string for any field that is not visible; never guess missing values.
Set confidence to an integer from 0 to 100 representing confidence in the payment evidence and extracted values.
Set valid=true only when the image itself clearly proves a successful completed payment and contains a readable amount. Otherwise set valid=false and briefly explain why in reason.`,
          },
        ],
        config: {
          httpOptions: { timeout: GEMINI_HTTP_TIMEOUT_MS },
          responseMimeType: 'application/json',
          responseJsonSchema: receiptSchema,
          temperature: 0,
        },
      }, validationController.signal);

      const result = JSON.parse(response.text);
      const extractedAmount = parsePaymentAmount(result?.amount);
      const expectedAmount = parsePaymentAmount(paymentAmount);
      const amountMatched = extractedAmount !== null
        && expectedAmount !== null
        && Math.abs(extractedAmount - expectedAmount) < 0.005;
      const receiverFields = {
        receiverPhone,
        receiverWallet,
        receiverUID,
        receiverEmail,
        receiverName,
        receiverWalletAddress,
      };
      const hasConfiguredReceiver = Object.values(receiverFields).some(
        (value) => String(value || '').trim().length > 0
      );
      const receiverMatched = Object.entries(receiverFields).some(
        ([field, configuredValue]) => fieldsMatch(field, result?.[field], configuredValue)
      );
      const imageTransactionId = String(result?.transactionId || '').trim();
      const userTransactionId = String(transactionId || '').trim();
      const transactionMatched = !imageTransactionId
        || !userTransactionId
        || imageTransactionId === userTransactionId;

      // Gemini classifies the image; all business-data comparisons remain deterministic locally.
      const isValid = result?.valid === true
        && result?.success === true
        && Number(result?.confidence) >= 90
        && amountMatched
        && receiverMatched
        && transactionMatched;

      // Ignore an older validation if the user chose or removed another file meanwhile.
      if (validationId !== validationIdRef.current) return;
      if (!isValid) {
        setError(getReceiptValidationError({
          result,
          extractedAmount,
          amountMatched,
          hasConfiguredReceiver,
          receiverMatched,
          transactionMatched,
        }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setUploadedFile(file);
      onFileUpload(file);
    } catch (error) {
      logGeminiError(error);
      if (validationId !== validationIdRef.current) return;
      // Fail closed on timeouts, network failures, SDK errors, or malformed JSON.
      setError(getGeminiRequestError(error, error?.name === 'TimeoutError'));
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      if (activeValidationControllerRef.current === validationController) {
        activeValidationControllerRef.current = null;
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveFile = () => {
    activeValidationControllerRef.current?.abort();
    activeValidationControllerRef.current = null;
    validationIdRef.current += 1;
    setUploadedFile(null);
    setError('');
    onFileUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div>
      {!uploadedFile ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="relative"
        >
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer overflow-hidden rounded-xl border border-dashed p-3 text-center transition sm:p-3.5 ${
              isDragOver
                ? 'border-emerald-400 bg-emerald-50/80 shadow-[0_18px_34px_-28px_rgba(16,185,129,0.55)] dark:border-emerald-500/60 dark:bg-emerald-950/24'
                : 'border-[color:rgb(var(--color-primary-rgb)/0.3)] bg-[color:rgb(var(--color-primary-rgb)/0.05)] hover:border-[color:rgb(var(--color-primary-rgb)/0.55)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.09)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex items-center gap-3 text-start">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#b45309,#d97706)] text-white shadow-[0_12px_24px_-16px_rgb(217_119_6/0.9)] transition-transform ${
                  isDragOver ? 'scale-110' : ''
                }`}>
                <Upload className="h-4 w-4 text-white" />
              </div>

              <div className="min-w-0">
                <h3 className="text-xs font-black text-[var(--color-text)]">
                  {isDragOver ? t('payments.upload.dropHere') : t('payments.upload.uploadTitle')}
                </h3>
                <p className="mt-0.5 truncate text-[10px] text-[var(--color-text-secondary)]">اضغط لاختيار صورة واضحة للإيصال</p>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent dark:via-sky-500/35"
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50/70 p-4 shadow-[0_14px_30px_-26px_rgba(16,185,129,0.5)] backdrop-blur-xl dark:border-emerald-900/70 dark:bg-emerald-950/20"
        >
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[0.9rem] border border-emerald-200 bg-white text-emerald-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.45)] dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-300">
              <FileImage className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="truncate font-black text-slate-950 dark:text-white">{uploadedFile.name}</h4>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{formatFileSize(uploadedFile.size)}</p>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-900/70 dark:bg-rose-950/35 dark:text-rose-300 dark:hover:bg-rose-950/55"
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/70 dark:bg-rose-950/25"
        >
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-300" />
            <p className="text-sm font-medium text-rose-700 dark:text-rose-200">{error}</p>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default UploadReceiptBox;
