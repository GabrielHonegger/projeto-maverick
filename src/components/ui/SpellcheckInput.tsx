import React, { useRef, useEffect, useState } from "react";
import { checkWord, getSuggestions, subscribeToSpellchecker, isSpellcheckerLoaded } from "@/utils/spellchecker";

interface SpellcheckInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export default function SpellcheckInput({
  value = "",
  onChange,
  className = "",
  containerClassName = "",
  placeholder,
  ...props
}: SpellcheckInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(isSpellcheckerLoaded());
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);

  useEffect(() => {
    return subscribeToSpellchecker((isLoaded) => {
      setLoaded(isLoaded);
    });
  }, []);

  const syncScroll = () => {
    if (inputRef.current && backdropRef.current) {
      backdropRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  // Sincroniza scroll após atualizações no valor ou seleção
  useEffect(() => {
    syncScroll();
  });

  const updateCursorIndex = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setCursorIndex(e.currentTarget.selectionStart);
    syncScroll();
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    updateCursorIndex(e);
    if (props.onClick) props.onClick(e);
  };

  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    updateCursorIndex(e);
    if (props.onKeyUp) props.onKeyUp(e);
  };

  const getActiveWordInfo = () => {
    if (cursorIndex === null || typeof value !== "string" || !loaded) return null;

    const wordRegex = /[a-zA-Z0-9_áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ-]/;
    
    let start = cursorIndex;
    while (start > 0 && wordRegex.test(value[start - 1])) {
      start--;
    }
    
    let end = cursorIndex;
    while (end < value.length && wordRegex.test(value[end])) {
      end++;
    }
    
    const word = value.slice(start, end).trim();
    if (!word || /^\d+$/.test(word)) return null;

    if (checkWord(word)) return null;

    const suggestions = getSuggestions(word);
    return { word, start, end, suggestions };
  };

  const activeSuggestion = getActiveWordInfo();

  const handleReplaceWord = (oldWord: string, newWord: string, start: number, end: number) => {
    if (!inputRef.current) return;
    const textStr = String(value);
    const before = textStr.slice(0, start);
    const after = textStr.slice(end);
    const updatedText = before + newWord + after;

    if (onChange) {
      const event = {
        target: {
          value: updatedText,
          name: inputRef.current.name,
          id: inputRef.current.id,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = start + newWord.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorIndex(newCursorPos);
        syncScroll();
      }
    }, 0);
  };

  const renderBackdropContent = () => {
    const textStr = String(value);
    if (!textStr) {
      return <span className="text-zinc-400 font-semibold">{placeholder}</span>;
    }

    const parts = textStr.split(/(\s+)/);

    return parts.map((part, index) => {
      if (/^\s+$/.test(part)) {
        return part;
      }
      
      const isCorrect = !loaded || checkWord(part);
      if (!isCorrect) {
        return (
          <span
            key={index}
            className="underline decoration-red-500 decoration-wavy decoration-2 font-semibold"
            title="Erro de ortografia"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex flex-col w-full ${containerClassName}`}>
      <div className="relative w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 focus-within:border-zinc-500 transition-colors h-9 flex items-center">
        {/* Backdrop */}
        <div
          ref={backdropRef}
          className="absolute left-0 right-0 pointer-events-none select-none whitespace-nowrap overflow-hidden text-zinc-700 not-italic flex items-center"
          style={{
            padding: "0 12px",
            fontSize: "12px",
            fontFamily: "inherit",
            height: "100%",
            lineHeight: "36px", // Alinha verticalmente com a altura do input h-9 (36px)
          }}
          aria-hidden="true"
        >
          {renderBackdropContent()}
        </div>

        {/* Input Principal */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onClick={handleInputClick}
          onKeyUp={handleInputKeyUp}
          onScroll={syncScroll}
          placeholder={loaded ? "" : placeholder}
          className="relative z-10 w-full h-full bg-transparent text-transparent caret-zinc-700 border-none focus:outline-none focus:ring-0 font-semibold px-3 text-xs block"
          {...props}
        />
      </div>

      {/* Sugestões */}
      {activeSuggestion && activeSuggestion.suggestions.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 mt-1 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-zinc-700 animate-fadeIn shrink-0">
          <span className="font-semibold text-amber-700">💡 Sugestão para "{activeSuggestion.word}":</span>
          {activeSuggestion.suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                handleReplaceWord(activeSuggestion.word, s, activeSuggestion.start, activeSuggestion.end)
              }
              className="bg-white border border-zinc-200 rounded px-1 py-0.5 font-bold hover:bg-zinc-100 hover:border-zinc-300 transition-colors cursor-pointer text-[10px] text-zinc-800"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
