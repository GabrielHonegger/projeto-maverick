import React, { useRef, useEffect, useState } from "react";
import { checkWord, getSuggestions, subscribeToSpellchecker, isSpellcheckerLoaded } from "@/utils/spellchecker";

interface SpellcheckTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
}

export default function SpellcheckTextarea({
  value = "",
  onChange,
  className = "",
  containerClassName = "",
  rows = 4,
  placeholder,
  ...props
}: SpellcheckTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(isSpellcheckerLoaded());
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);

  // Se inscreve no carregamento do dicionário para re-renderizar quando estiver pronto
  useEffect(() => {
    return subscribeToSpellchecker((isLoaded) => {
      setLoaded(isLoaded);
    });
  }, []);

  // Sincroniza o scroll do backdrop com o textarea
  const syncScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    syncScroll();
  }, [value]);

  // Atualiza a posição do cursor
  const updateCursorIndex = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorIndex(e.currentTarget.selectionStart);
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    updateCursorIndex(e);
    if (props.onClick) props.onClick(e);
  };

  const handleTextareaKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    updateCursorIndex(e);
    if (props.onKeyUp) props.onKeyUp(e);
  };

  // Encontra a palavra sob o cursor
  const getActiveWordInfo = () => {
    if (cursorIndex === null || typeof value !== "string" || !loaded) return null;
    
    // Regex para identificar caracteres de palavras em português
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

    // Se a palavra estiver correta, não exibe sugestões
    if (checkWord(word)) return null;

    const suggestions = getSuggestions(word);
    return { word, start, end, suggestions };
  };

  const activeSuggestion = getActiveWordInfo();

  // Corrige a palavra selecionada
  const handleReplaceWord = (oldWord: string, newWord: string, start: number, end: number) => {
    if (!textareaRef.current) return;
    const textStr = String(value);
    const before = textStr.slice(0, start);
    const after = textStr.slice(end);
    const updatedText = before + newWord + after;

    if (onChange) {
      const event = {
        target: {
          value: updatedText,
          name: textareaRef.current.name,
          id: textareaRef.current.id,
        },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(event);
    }

    // Devolve o foco para o textarea e posiciona o cursor após a palavra corrigida
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + newWord.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorIndex(newCursorPos);
      }
    }, 0);
  };

  // Renderiza o texto do backdrop com marcações de erro
  const renderBackdropContent = () => {
    const textStr = String(value);
    if (!textStr) {
      return <span className="text-zinc-400 font-semibold">{placeholder}</span>;
    }

    // Divide o texto por espaços mantendo os delimitadores
    const parts = textStr.split(/(\s+)/);

    return parts.map((part, index) => {
      if (/^\s+$/.test(part)) {
        return part; // Espaços e quebras de linha são mantidos puramente
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

  // Separa as classes para garantir que o textarea fique transparente e alinhado ao backdrop
  const baseTextAreaClass = className.replace(/bg-\S+/g, "").replace(/border-\S+/g, "");

  return (
    <div className={`flex flex-col w-full ${containerClassName}`}>
      <div className="relative w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 focus-within:border-zinc-500 transition-colors">
        {/* Backdrop: Div invisível por trás do Textarea para exibir os sublinhados vermelhos */}
        <div
          ref={backdropRef}
          className="absolute inset-0 w-full h-full pointer-events-none select-none whitespace-pre-wrap break-words overflow-hidden text-zinc-700 not-italic"
          style={{
            padding: "8px 12px",
            fontSize: "12px",
            lineHeight: "1.6",
            fontFamily: "inherit",
          }}
          aria-hidden="true"
        >
          {renderBackdropContent()}
        </div>

        {/* Textarea Principal: Transparente com cursor (caret) visível */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onScroll={syncScroll}
          onClick={handleTextareaClick}
          onKeyUp={handleTextareaKeyUp}
          rows={rows}
          placeholder={loaded ? "" : placeholder} // Só limpa placeholder nativo se carregado para evitar sobreposição
          className={`relative z-10 w-full h-full bg-transparent text-transparent caret-zinc-700 border-none focus:outline-none focus:ring-0 font-semibold resize-none block`}
          style={{
            padding: "8px 12px",
            fontSize: "12px",
            lineHeight: "1.6",
            fontFamily: "inherit",
          }}
          {...props}
        />
      </div>

      {/* Barra de Sugestões de Correção */}
      {activeSuggestion && activeSuggestion.suggestions.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 mt-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-zinc-700 animate-fadeIn shrink-0">
          <span className="font-semibold text-amber-700">💡 Sugestão para "{activeSuggestion.word}":</span>
          {activeSuggestion.suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                handleReplaceWord(activeSuggestion.word, s, activeSuggestion.start, activeSuggestion.end)
              }
              className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 font-bold hover:bg-zinc-100 hover:border-zinc-300 transition-colors cursor-pointer text-[10px] text-zinc-800"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
