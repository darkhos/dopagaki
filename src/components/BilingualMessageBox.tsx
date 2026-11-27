import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Globe, Languages } from 'lucide-react';
import {
  buildInterlinearLines,
  resolveDefaultSendLang,
  type MessageLang,
  type MessagePurpose
} from '@/lib/bilingual-message.ts';

interface BilingualMessageBoxProps {
  ko: string;
  ja: string;
  uiLang: MessageLang;
  japaneseSupport: boolean;
  purpose: MessagePurpose;
  allowLangSwitch?: boolean;
  compact?: boolean;
  onCopied?: (copiedLang: MessageLang) => void;
}

export function BilingualMessageBox({
  ko,
  ja,
  uiLang,
  japaneseSupport,
  purpose,
  allowLangSwitch = purpose === 'inquiry',
  compact = false,
  onCopied
}: BilingualMessageBoxProps) {
  const isJaUi = uiLang === 'ja';
  const defaultSend = resolveDefaultSendLang(uiLang, japaneseSupport, purpose);
  const [sendLang, setSendLang] = useState<MessageLang>(defaultSend);
  const [showGloss, setShowGloss] = useState<boolean>(isJaUi && defaultSend === 'ko');
  const [copyStatus, setCopyStatus] = useState<'copied' | 'failed' | null>(null);

  useEffect(() => {
    const nextDefault = resolveDefaultSendLang(uiLang, japaneseSupport, purpose);
    setSendLang(nextDefault);
    setShowGloss(uiLang === 'ja' && nextDefault === 'ko');
  }, [uiLang, japaneseSupport, purpose]);

  const primaryText = sendLang === 'ja' ? ja : ko;
  const glossText = sendLang === 'ja' ? ko : ja;
  const glossLang: MessageLang = sendLang === 'ja' ? 'ko' : 'ja';

  const lines = useMemo(
    () => buildInterlinearLines(primaryText, glossText),
    [primaryText, glossText]
  );

  const badgeText = (() => {
    if (purpose === 'order') {
      return isJaUi
        ? '受付で見せる韓国語（日本語訳で確認OK）'
        : '접수대 제시용 한국어 · 일본어 뜻 병기 가능';
    }
    if (japaneseSupport) {
      return sendLang === 'ja'
        ? isJaUi
          ? '日本語OK院 · 日本語のままで送信できます'
          : '일본어 가능 지점 · 일본어 그대로 전송 OK'
        : isJaUi
          ? '日本語OK院 · 韓国語版を表示中'
          : '일본어 가능 지점 · 한국어 버전 선택됨';
    }
    return isJaUi
      ? '韓国語送信推奨 · 翻訳アプリ配慮文入り'
      : '한국어 전송 권장 · 번역 앱 배려 문구 포함';
  })();

  const copyLabel = (() => {
    if (copyStatus === 'copied') {
      return isJaUi ? 'コピーしました！' : '복사 완료!';
    }
    if (sendLang === 'ja') {
      return isJaUi ? '日本語をコピー' : '일본어 문구 복사';
    }
    return isJaUi
      ? showGloss
        ? '韓国語だけコピー'
        : '韓国語をコピー'
      : showGloss
        ? '한국어만 복사'
        : '한국어 문구 복사';
  })();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(primaryText);
      setCopyStatus('copied');
      onCopied?.(sendLang);
      window.setTimeout(() => setCopyStatus(null), 1800);
    } catch {
      setCopyStatus('failed');
    }
  };

  return (
    <div className={`dopa-bmsg${compact ? ' is-compact' : ''}`}>
      <div className="dopa-bmsg-bar">
        <span className={`dopa-bmsg-badge${japaneseSupport && purpose === 'inquiry' ? ' is-jp' : ''}`}>
          <Globe size={11} strokeWidth={2.3} />
          <span>{badgeText}</span>
        </span>

        <div className="dopa-bmsg-controls">
          {allowLangSwitch && (
            <div
              className="dopa-bmsg-seg"
              role="group"
              aria-label={isJaUi ? '送信言語を選択' : '전송 언어 선택'}
            >
              <button
                type="button"
                className={sendLang === 'ja' ? 'is-on' : ''}
                aria-pressed={sendLang === 'ja'}
                onClick={() => {
                  setSendLang('ja');
                  setShowGloss(false);
                }}
              >
                {isJaUi ? '日本語' : '일본어'}
              </button>
              <button
                type="button"
                className={sendLang === 'ko' ? 'is-on' : ''}
                aria-pressed={sendLang === 'ko'}
                onClick={() => {
                  setSendLang('ko');
                  if (isJaUi) setShowGloss(true);
                }}
              >
                {isJaUi ? '韓国語' : '한국어'}
              </button>
            </div>
          )}

          {sendLang === 'ko' && (
            <button
              type="button"
              className={`dopa-bmsg-gloss-btn${showGloss ? ' is-on' : ''}`}
              aria-pressed={showGloss}
              onClick={() => setShowGloss((v) => !v)}
            >
              <Languages size={12} strokeWidth={2.2} />
              <span>
                {isJaUi
                  ? showGloss
                    ? '日本語訳ON'
                    : '日本語訳'
                  : showGloss
                    ? '일본어 뜻 ON'
                    : '일본어 뜻'}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="dopa-bmsg-preview" lang={sendLang}>
        {showGloss ? (
          <div className="dopa-bmsg-interlinear">
            {lines.map((line, i) =>
              line.spacer ? (
                <div key={i} className="dopa-bmsg-spacer" aria-hidden="true" />
              ) : (
                <div key={i} className="dopa-bmsg-line">
                  <p className="dopa-bmsg-primary">{line.primary}</p>
                  {line.gloss && line.gloss !== line.primary && (
                    <p className="dopa-bmsg-gloss" lang={glossLang}>
                      {line.gloss}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <pre className="dopa-bmsg-pre" lang={sendLang}>
            {primaryText}
          </pre>
        )}
      </div>

      <div className="dopa-bmsg-foot">
        <button type="button" className="dopa-bmsg-copy-btn" onClick={() => void handleCopy()}>
          {copyStatus === 'copied' ? (
            <Check size={14} strokeWidth={2.5} />
          ) : (
            <Copy size={13} strokeWidth={2.2} />
          )}
          <span>{copyLabel}</span>
        </button>

        {showGloss && sendLang === 'ko' && (
          <span className="dopa-bmsg-hint">
            {isJaUi
              ? '※ 日本語訳は除いて韓国語だけコピーされます'
              : '※ 일본어 뜻은 빼고 깔끔한 한국어만 복사돼요'}
          </span>
        )}
        {copyStatus === 'failed' && (
          <small role="status" className="dopa-bmsg-hint">
            {isJaUi ? '上の文章を選択してコピーしてください' : '위 문장을 직접 선택해 복사해 주세요'}
          </small>
        )}
      </div>
    </div>
  );
}
