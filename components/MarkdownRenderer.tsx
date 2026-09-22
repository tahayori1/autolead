import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
    content: string;
    isUser?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isUser = false }) => {
    const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

    const handleCopyCode = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedCodeIndex(index);
        setTimeout(() => setCopiedCodeIndex(null), 2000);
    };

    return (
        <div className={`markdown-content text-xs leading-relaxed break-words ${isUser ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => (
                        <p className="mb-2 last:mb-0 leading-relaxed font-sans">{children}</p>
                    ),
                    h1: ({ children }) => (
                        <h1 className={`text-sm sm:text-base font-black mt-3 mb-2 pb-1 border-b ${
                            isUser ? 'border-white/20 text-white' : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                        }`}>
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className={`text-xs sm:text-sm font-black mt-2.5 mb-1.5 ${
                            isUser ? 'text-white' : 'text-slate-900 dark:text-white'
                        }`}>
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className={`text-xs font-bold mt-2 mb-1 ${
                            isUser ? 'text-white/90' : 'text-slate-800 dark:text-slate-100'
                        }`}>
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className={`text-xs font-bold mt-1.5 mb-1 ${
                            isUser ? 'text-white/90' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                            {children}
                        </h4>
                    ),
                    strong: ({ children }) => (
                        <strong className={`font-black ${isUser ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {children}
                        </strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic opacity-90">{children}</em>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 my-2 pr-1.5 text-xs marker:text-sky-500">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 my-2 pr-1.5 text-xs marker:text-sky-500">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-relaxed">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className={`my-2 pr-3 pl-2 py-1.5 border-r-3 rounded-l-lg text-xs leading-relaxed ${
                            isUser 
                                ? 'border-white/60 bg-white/10 text-white/90' 
                                : 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/30 text-slate-700 dark:text-slate-300'
                        }`}>
                            {children}
                        </blockquote>
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs max-w-full">
                            <table className="min-w-full text-right border-collapse text-xs">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className={isUser ? 'bg-white/15 text-white' : 'bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100'}>
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody className={`divide-y ${isUser ? 'divide-white/15' : 'divide-slate-200/80 dark:divide-slate-800'}`}>
                            {children}
                        </tbody>
                    ),
                    tr: ({ children }) => (
                        <tr className={isUser ? 'hover:bg-white/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors'}>
                            {children}
                        </tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-3 py-2 text-[11px] font-black border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-3 py-2 text-xs border-b border-slate-100 dark:border-slate-800/60 leading-normal">
                            {children}
                        </td>
                    ),
                    hr: () => (
                        <hr className={`my-3 border-t ${isUser ? 'border-white/20' : 'border-slate-200 dark:border-slate-800'}`} />
                    ),
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`underline font-bold transition-colors ${
                                isUser ? 'text-white hover:text-white/80' : 'text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300'
                            }`}
                        >
                            {children}
                        </a>
                    ),
                    code: ({ node, className, children, ...props }) => {
                        const codeString = String(children).replace(/\n$/, '');
                        const isMultiLine = codeString.includes('\n');
                        const isCodeBlock = isMultiLine || className?.includes('language-');

                        if (isCodeBlock) {
                            return (
                                <div className="relative my-2.5 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-sm dir-ltr text-left">
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/70 border-b border-slate-800 text-[10px] text-slate-400">
                                        <span className="font-mono">{className?.replace('language-', '') || 'code'}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyCode(codeString, Math.random())}
                                            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                                        >
                                            <Copy className="w-3 h-3" />
                                            <span>کپی کد</span>
                                        </button>
                                    </div>
                                    <pre className="p-3 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                                        <code>{codeString}</code>
                                    </pre>
                                </div>
                            );
                        }

                        return (
                            <code 
                                className={`px-1.5 py-0.5 rounded text-[11px] font-mono dir-ltr inline-block mx-0.5 align-middle ${
                                    isUser 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200/80 dark:border-slate-700/60'
                                }`} 
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
