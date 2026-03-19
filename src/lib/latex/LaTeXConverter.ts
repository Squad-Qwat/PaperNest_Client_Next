/**
 * LaTeXConverter.ts
 * Utility to convert between LaTeX source code and Tiptap-friendly HTML.
 */

export interface LaTeXParts {
    preamble: string;
    body: string;
    postamble: string;
}

export class LaTeXConverter {
    /**
     * Splits a LaTeX document into preamble, body, and postamble.
     */
    static splitDocument(latex: string): LaTeXParts {
        const beginMatch = latex.match(/\\begin\{document\}/);
        const endMatch = latex.match(/\\end\{document\}/);

        if (!beginMatch) {
            return { preamble: '', body: latex, postamble: '' };
        }

        const beginIndex = beginMatch.index!;
        const beginTag = beginMatch[0];
        const endIndex = endMatch ? endMatch.index! : latex.length;
        const endTag = endMatch ? endMatch[0] : '';

        return {
            preamble: latex.substring(0, beginIndex + beginTag.length),
            body: latex.substring(beginIndex + beginTag.length, endIndex),
            postamble: latex.substring(endIndex)
        };
    }

    /**
     * Joins document parts back together.
     */
    static joinDocument(parts: LaTeXParts): string {
        return parts.preamble + parts.body + parts.postamble;
    }

    /**
     * Converts LaTeX source to HTML for Tiptap
     */
    static toHTML(latex: string): string {
        if (!latex) return '';

        let html = latex;

        // Helper to escape LaTeX for data attributes
        const escapeForAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Step 0: Extract and protect complex blocks with placeholders
        // These will become non-editable protected blocks

        // Protected: \twocolumn[...] blocks (store raw, don't parse)
        const twocolumnBlocks: string[] = [];
        html = html.replace(/\\twocolumn\s*\[((?:[^\[\]]|\[(?:[^\[\]]|\[[^\[\]]*\])*\])*)\]/g, (match: string) => {
            const placeholder = `__LATEX_PROTECTED_TWOCOLUMN_${twocolumnBlocks.length}__`;
            twocolumnBlocks.push(match);  // Store entire match including \twocolumn[...]
            return placeholder;
        });

        // Protected: \begin{table}...\end{table}
        const tableBlocks: string[] = [];
        html = html.replace(/\\begin\{table\}(\[[^\]]*\])?([\s\S]*?)\\end\{table\}/g, (match: string) => {
            const placeholder = `__LATEX_PROTECTED_TABLE_${tableBlocks.length}__`;
            tableBlocks.push(match);
            return placeholder;
        });

        // Protected: \begin{figure}...\end{figure}
        const figureBlocks: string[] = [];
        html = html.replace(/\\begin\{figure\}(\[[^\]]*\])?([\s\S]*?)\\end\{figure\}/g, (match: string) => {
            const placeholder = `__LATEX_PROTECTED_FIGURE_${figureBlocks.length}__`;
            figureBlocks.push(match);
            return placeholder;
        });

        // Protected: \begin{thebibliography}{...}...\end{thebibliography} (argument now optional)
        const bibBlocks: string[] = [];
        html = html.replace(/\\begin\{thebibliography\}(?:\{[^}]*\})?([\s\S]*?)\\end\{thebibliography\}/g, (match: string) => {
            const placeholder = `__LATEX_PROTECTED_BIB_${bibBlocks.length}__`;
            bibBlocks.push(match);
            return placeholder;
        });

        // Protected: \begin{abstract}...\end{abstract}
        const abstractBlocks: string[] = [];
        html = html.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (match: string) => {
            const placeholder = `__LATEX_PROTECTED_ABSTRACT_${abstractBlocks.length}__`;
            abstractBlocks.push(match);
            return placeholder;
        });

        // Protected: Math environments (equation, align, gather, multline, etc.)
        const mathEnvBlocks: string[] = [];
        const mathEnvNames = ['equation', 'equation\\*', 'align', 'align\\*', 'gather', 'gather\\*', 'multline', 'multline\\*', 'eqnarray', 'eqnarray\\*'];
        for (const envName of mathEnvNames) {
            const regex = new RegExp(`\\\\begin\\{${envName}\\}([\\s\\S]*?)\\\\end\\{${envName}\\}`, 'g');
            html = html.replace(regex, (match: string) => {
                const placeholder = `__LATEX_PROTECTED_MATHENV_${mathEnvBlocks.length}__`;
                mathEnvBlocks.push(match);
                return placeholder;
            });
        }

        // 1. Preserve common document commands
        html = html.replace(/\\centering\s*/g, '<span data-type="latex-cmd" data-cmd="centering"></span>');
        html = html.replace(/\\noindent\s*/g, '<span data-type="latex-cmd" data-cmd="noindent"></span>');
        html = html.replace(/\\label\{([^{}]*)\}\s*/g, '<span data-type="latex-cmd" data-cmd="label" data-val="$1"></span>');

        // Font size commands (preserve them)
        html = html.replace(/\\(tiny|scriptsize|footnotesize|small|normalsize|large|Large|LARGE|huge|Huge)\b/g, '<span data-type="latex-fontsize" data-size="$1"></span>');

        // Font style commands (preserve them)
        html = html.replace(/\\(bfseries|mdseries|itshape|slshape|scshape|upshape|rmfamily|sffamily|ttfamily)\b/g, '<span data-type="latex-fontstyle" data-style="$1"></span>');

        // Color commands with parameter
        html = html.replace(/\\color\{([^{}]+)\}/g, '<span data-type="latex-color" data-color="$1"></span>');

        // Preserve standalone curly braces (for grouping scope in LaTeX)
        // These are braces at line boundaries used for scoping commands
        html = html.replace(/^(\s*)\{(\s*$)/gm, '$1<span data-latex-brace="open"></span>$2');
        html = html.replace(/^(\s*)\}(\s*$)/gm, '$1<span data-latex-brace="close"></span>$2');

        // Hyperlinks: \href{url}{text}
        html = html.replace(/\\href\{([^{}]*)\}\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, '<a href="$1" data-latex-href="true">$2</a>');

        // Inline LaTeX commands (rendered as non-editable chips)
        // \cite{key}, \citep{key}, \citeauthor{key}, etc.
        html = html.replace(/\\(cite[a-z]*)\{([^{}]+)\}/g, (match, cmd) => {
            const escaped = escapeForAttr(match);
            return `<span data-type="latex-inline-cmd" data-cmd="${cmd}" data-latex="${escaped}">${cmd}</span>`;
        });

        // \footnote{text} - may contain nested braces
        html = html.replace(/\\footnote\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, (match) => {
            const escaped = escapeForAttr(match);
            return `<span data-type="latex-inline-cmd" data-cmd="footnote" data-latex="${escaped}">footnote</span>`;
        });

        // \ref{label}, \pageref{label}
        html = html.replace(/\\(page)?ref\{([^{}]+)\}/g, (match, page) => {
            const cmd = page ? 'pageref' : 'ref';
            const escaped = escapeForAttr(match);
            return `<span data-type="latex-inline-cmd" data-cmd="${cmd}" data-latex="${escaped}">${cmd}</span>`;
        });

        // \includegraphics[options]{path}
        html = html.replace(/\\includegraphics(?:\[[^\]]*\])?\{[^{}]+\}/g, (match) => {
            const escaped = escapeForAttr(match);
            return `<span data-type="latex-inline-cmd" data-cmd="includegraphics" data-latex="${escaped}">image</span>`;
        });

        // Handle captions with potential nested braces
        html = html.replace(/\\caption\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, '<p class="latex-caption" style="text-align: center; font-style: italic; margin-bottom: 0.5rem; color: #4a5568;">$1</p>');

        // 2. Comments Protection (Critical: Must be BEFORE newline normalization)
        html = html.replace(/(^|[^\\])%([^\n]*)/g, (match, prefix, comment) => {
            return `${prefix}<span data-type="latex-comment" data-comment="${escapeForAttr(comment)}"></span>`;
        });

        // 3a. [twocolumn blocks already extracted to placeholders in Step 0]

        // 3b. Layout commands (preserve them with optional parameters)
        // First handle commands WITH curly braces: \vspace{10pt}, \hspace{2em}
        html = html.replace(/\\(vspace|hspace)\s*\{([^{}]*)\}/g, (match, cmd, val) => {
            return `<span data-type="latex-layout" data-cmd="${cmd}" data-val="${val.trim()}"></span>`;
        });

        // Then handle \hrule height 1pt, \vrule width 2em (with parameters but no braces)
        html = html.replace(/\\(hrule|vrule)\s+([^\\\n{}\[\]$]+)/g, (match, cmd, params) => {
            return `<span data-type="latex-layout" data-cmd="${cmd}" data-val="${params.trim()}"></span>`;
        });

        // Single layout commands without parameters
        html = html.replace(/\\(newline|newpage|clearpage|columnsep|titlerule)\b/g, '<span data-type="latex-layout" data-cmd="$1"></span>');

        // 4. Tables - Now handled as protected blocks above, remove old handling
        // Any remaining tabular environments inside other structures can stay as-is

        // 5. Basic formatting
        html = html.replace(/\\textbf\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, '<strong>$1</strong>');
        html = html.replace(/\\textit\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, '<em>$1</em>');
        html = html.replace(/\\underline\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, '<u>$1</u>');

        // 6. Headers
        html = html.replace(/\\section\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, '<h1>$1</h1>');
        html = html.replace(/\\subsection\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, '<h2>$1</h2>');
        html = html.replace(/\\subsubsection\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g, '<h3>$1</h3>');

        // 7. Lists
        html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (match: string, content: string) => {
            const items = content
                .split(/\\item\s+/)
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0)
                .map((item: string) => `<li>${item}</li>`)
                .join('');
            return `<ul>${items}</ul>`;
        });
        html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (match: string, content: string) => {
            const items = content
                .split(/\\item\s+/)
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0)
                .map((item: string) => `<li>${item}</li>`)
                .join('');
            return `<ol>${items}</ol>`;
        });

        // 8. Math
        html = html.replace(/\$((?:[^\$]|\\\$)*?)\$/g, (match, content) => {
            return `<span data-type="math" data-latex="${content}">$${content}$</span>`;
        });
        html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => {
            return `<div data-type="math-block" data-latex="${content}">\\[${content}\\]</div>`;
        });

        // 9. Environments (General fallback - Support @ and * and _)
        // Skip environments that are handled as protected blocks or lists
        const protectedEnvs = ['itemize', 'enumerate', 'tabular', 'table', 'figure', 'thebibliography', 'abstract', 'equation', 'equation*', 'align', 'align*', 'gather', 'gather*', 'multline', 'multline*', 'eqnarray', 'eqnarray*'];
        html = html.replace(/\\begin\{([a-zA-Z0-9@_*]+)\}([\s\S]*?)\\end\{\1\}/g, (match: string, env: string, content: string) => {
            if (protectedEnvs.includes(env)) return match;
            return `<pre data-type="latex-env" data-env="${env}"><code>${content.trim()}</code></pre>`;
        });

        // 10. Line breaks & Paragraphs
        html = html.replace(/\\\\/g, '<br>');

        // NEW: Protect single newlines (but NOT double newlines which are paragraph breaks)
        // Double newlines must remain for split('\n\n') to work correctly
        let singleNewlineIndex = 0;
        const singleNewlineMap: { [key: string]: boolean } = {};
        html = html.replace(/\n(?!\n)/g, (match) => {
            // Match \n that is NOT followed by another \n (negative lookahead)
            const marker = `__LATEX_NEWLINE_${singleNewlineIndex}__`;
            singleNewlineMap[marker] = true;
            singleNewlineIndex++;
            return marker;
        });

        html = html.split('\n\n').filter(Boolean).map((p: string) => {
            const trimmed = p.trim();
            // Don't wrap specialized blocks or standalone commands in <p>
            if (trimmed.startsWith('<h') ||
                trimmed.startsWith('<ul') ||
                trimmed.startsWith('<ol') ||
                trimmed.startsWith('<pre') ||
                trimmed.startsWith('<div') ||
                trimmed.startsWith('<table') ||
                trimmed.startsWith('<span data-type="latex-layout"') ||
                trimmed.startsWith('<span data-type="latex-comment"') ||
                trimmed.startsWith('__LATEX_PROTECTED_')) {  // Don't wrap placeholders
                return trimmed;
            }
            const normalizedContent = trimmed;
            return `<p>${normalizedContent}</p>`;
        }).join('');

        // NEW: Restore protected single newlines as LaTeX newline nodes
        Object.keys(singleNewlineMap).forEach((marker) => {
            const newlineSpan = `<span data-type="latex-newline" data-count="1"></span>`;
            html = html.replace(new RegExp(marker, 'g'), newlineSpan);
        });

        // Step Final: Restore protected blocks as non-editable divs
        // These store raw LaTeX and render as "[type] Edit in Source Mode"

        // Restore twocolumn blocks
        twocolumnBlocks.forEach((rawLatex, index) => {
            const placeholder = `__LATEX_PROTECTED_TWOCOLUMN_${index}__`;
            const escaped = escapeForAttr(rawLatex);
            html = html.replace(placeholder, `<div data-type="latex-protected" data-latex="${escaped}" data-block-type="twocolumn" contenteditable="false" class="latex-protected-block">[twocolumn] Edit in Source Mode</div>`);
        });

        // Restore table blocks
        tableBlocks.forEach((rawLatex, index) => {
            const placeholder = `__LATEX_PROTECTED_TABLE_${index}__`;
            const escaped = escapeForAttr(rawLatex);
            html = html.replace(placeholder, `<div data-type="latex-protected" data-latex="${escaped}" data-block-type="table" contenteditable="false" class="latex-protected-block">[table] Edit in Source Mode</div>`);
        });

        // Restore figure blocks
        figureBlocks.forEach((rawLatex, index) => {
            const placeholder = `__LATEX_PROTECTED_FIGURE_${index}__`;
            const escaped = escapeForAttr(rawLatex);
            html = html.replace(placeholder, `<div data-type="latex-protected" data-latex="${escaped}" data-block-type="figure" contenteditable="false" class="latex-protected-block">[figure] Edit in Source Mode</div>`);
        });

        // Restore bibliography blocks
        bibBlocks.forEach((rawLatex, index) => {
            const placeholder = `__LATEX_PROTECTED_BIB_${index}__`;
            const escaped = escapeForAttr(rawLatex);
            html = html.replace(placeholder, `<div data-type="latex-protected" data-latex="${escaped}" data-block-type="thebibliography" contenteditable="false" class="latex-protected-block">[bibliography] Edit in Source Mode</div>`);
        });

        // Restore abstract blocks
        abstractBlocks.forEach((rawLatex, index) => {
            const placeholder = `__LATEX_PROTECTED_ABSTRACT_${index}__`;
            const escaped = escapeForAttr(rawLatex);
            html = html.replace(placeholder, `<div data-type="latex-protected" data-latex="${escaped}" data-block-type="abstract" contenteditable="false" class="latex-protected-block">[abstract] Edit in Source Mode</div>`);
        });

        // Restore math environment blocks
        mathEnvBlocks.forEach((rawLatex, index) => {
            const placeholder = `__LATEX_PROTECTED_MATHENV_${index}__`;
            const escaped = escapeForAttr(rawLatex);
            html = html.replace(placeholder, `<div data-type="latex-protected" data-latex="${escaped}" data-block-type="equation" contenteditable="false" class="latex-protected-block">[equation] Edit in Source Mode</div>`);
        });

        return html;
    }

    /**
     * Converts Tiptap HTML back to LaTeX source
     */
    static toLaTeX(html: string): string {
        if (!html) return '';

        let latex = html;

        const decodeHtmlEntities = (value: string): string => {
            return value
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&nbsp;/g, ' ');
        };

        const getAttr = (attributes: string, name: string): string | null => {
            const match = attributes.match(new RegExp(`${name}="([^"]*)"`));
            return match ? match[1] : null;
        };

        const listToLatex = (content: string, environment: 'itemize' | 'enumerate') => {
            const matches = [...content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
            const items = matches.map((entry) => {
                const rawText = entry[1]
                    .replace(/<br\s*\/?>/g, '\n')
                    .replace(/<[^>]*>/g, '');
                const text = decodeHtmlEntities(rawText).trim();
                return text ? `  \\item ${text}` : '  \\item';
            }).filter((item) => item !== '  \\item');
            return `\\begin{${environment}}\n${items.join('\n')}\n\\end{${environment}}`;
        };

        // 1. Convert specific Tiptap/LaTeX data components

        // Math - improved to handle escaped quotes and nested content
        latex = latex.replace(/<span data-type="math"[^>]*data-latex="([^"]*)"[^>]*>.*?<\/span>/g, (match, content) => {
            const decoded = decodeHtmlEntities(content);
            return `$${decoded}$`;
        });
        latex = latex.replace(/<div data-type="math-block"[^>]*data-latex="([^"]*)"[^>]*>.*?<\/div>/g, (match, content) => {
            const decoded = decodeHtmlEntities(content);
            return `\\[\n${decoded}\n\\]`;
        });

        // Restore LaTeX newlines (work with the protected newline nodes from visual editor)
        latex = latex.replace(/<span data-type="latex-newline"[^>]*>[^<]*<\/span>/g, '\n');

        // Captions
        latex = latex.replace(/<p class="latex-caption".*?>([\s\S]*?)<\/p>/g, '\\caption{$1}');

        // Comments (handle content rendered by Tiptap extension)
        // NOTE: Don't add \n here - if there's a newline after the comment,
        // it will be a separate latex-newline node that gets restored to \n
        latex = latex.replace(/<span data-type="latex-comment"[^>]*data-comment="([^"]*)"[^>]*>[^<]*<\/span>/g, (match, comment) => {
            return `%${decodeHtmlEntities(comment)}`;
        });

        // Font size commands (handle potential content from extensions)
        latex = latex.replace(/<span data-type="latex-fontsize"[^>]*data-size="([^"]*)"[^>]*>[^<]*<\/span>/g, (match, size) => {
            return `\\${size} `;
        });

        // Font style commands (handle potential content from extensions)
        latex = latex.replace(/<span data-type="latex-fontstyle"[^>]*data-style="([^"]*)"[^>]*>[^<]*<\/span>/g, (match, style) => {
            return `\\${style} `;
        });

        // Color commands (handle potential content from extensions)
        latex = latex.replace(/<span data-type="latex-color"[^>]*data-color="([^"]*)"[^>]*>[^<]*<\/span>/g, (match, color) => {
            return `\\color{${color}}`;
        });

        // Hyperlinks
        latex = latex.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, (match, url, text) => {
            return `\\href{${url}}{${text}}`;
        });

        // Restore LaTeX group braces (handle content rendered by extensions)
        latex = latex.replace(/<span data-latex-brace="open"[^>]*>[^<]*<\/span>/g, '{');
        latex = latex.replace(/<span data-latex-brace="close"[^>]*>[^<]*<\/span>/g, '}');

        // General document commands (centering, noindent, label) - handle extension content
        latex = latex.replace(/<span data-type="latex-cmd"[^>]*data-cmd="([^"]*)"(?:[^>]*data-val="([^"]*)")?[^>]*>[^<]*<\/span>/g, (match, cmd, val) => {
            if (val) {
                return `\\${cmd}{${val}}`;
            }
            // Commands that need trailing space
            if (['noindent', 'centering'].includes(cmd)) {
                return `\\${cmd} `;
            }
            return `\\${cmd}`;
        });

        latex = latex.replace(/<div\b([^>]*)data-type="latex-protected"([^>]*)>[\s\S]*?<\/div>/g, (match, beforeAttrs, afterAttrs) => {
            const attributes = `${beforeAttrs} ${afterAttrs}`;
            const encoded = getAttr(attributes, 'data-latex');
            if (!encoded) return '';
            return decodeHtmlEntities(encoded);
        });

        latex = latex.replace(/<span\b([^>]*)data-type="latex-inline-cmd"([^>]*)>[\s\S]*?<\/span>/g, (match, beforeAttrs, afterAttrs) => {
            const attributes = `${beforeAttrs} ${afterAttrs}`;
            const encoded = getAttr(attributes, 'data-latex');
            if (!encoded) return '';
            return decodeHtmlEntities(encoded);
        });

        // Fallback Environments (for any remaining non-protected environments)
        // IMPROVED: More flexible matching
        latex = latex.replace(/<pre[^>]*>[\s\S]*?<code>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/g, (match) => {
            // Extract data-env if present
            const envMatch = match.match(/data-env="([^"]*)"/);
            if (!envMatch) {
                // No data-env, return content as-is (just strip pre/code tags)
                const codeMatch = match.match(/<code>([\s\S]*?)<\/code>/);
                return codeMatch ? codeMatch[1] : match;
            }

            const env = envMatch[1];
            const codeMatch = match.match(/<code>([\s\S]*?)<\/code>/);
            const content = codeMatch ? codeMatch[1] : '';

            return `\\begin{${env}}\n${content}\n\\end{${env}}`;
        });

        // 2. Standard Tiptap tags to LaTeX

        // Paragraphs to single/double newlines
        // IMPORTANT: Handle <br> inside paragraphs properly (single newline, not \\)
        latex = latex.replace(/<p>([\s\S]*?)<\/p>/g, (match, content) => {
            // Replace <br> with newline inside paragraphs (not \\)
            const cleanContent = content.replace(/<br\s*\/?>/g, '\n');
            return `${cleanContent}\n\n`;
        });

        // Headers
        latex = latex.replace(/<h1>(.*?)<\/h1>/g, '\\section{$1}');
        latex = latex.replace(/<h2>(.*?)<\/h2>/g, '\\subsection{$1}');
        latex = latex.replace(/<h3>(.*?)<\/h3>/g, '\\subsubsection{$1}');

        // Formatting
        latex = latex.replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}');
        latex = latex.replace(/<em>(.*?)<\/em>/g, '\\textit{$1}');
        latex = latex.replace(/<u>(.*?)<\/u>/g, '\\underline{$1}');

        // Lists
        latex = latex.replace(/<ul>([\s\S]*?)<\/ul>/g, (match: string, content: string) => {
            return listToLatex(content, 'itemize');
        });
        latex = latex.replace(/<ol>([\s\S]*?)<\/ol>/g, (match: string, content: string) => {
            return listToLatex(content, 'enumerate');
        });

        // Layout commands (handle content rendered by Tiptap: [vspace: 10pt])
        latex = latex.replace(/<span data-type="latex-layout"[^>]*data-cmd="([^"]*)"(?:[^>]*data-val="([^"]*)")?[^>]*>[^<]*<\/span>/g, (match, cmd, val) => {
            if (!val) {
                return `\\${cmd}`;
            }
            // Commands that need curly braces for parameters
            if (['vspace', 'hspace'].includes(cmd)) {
                return `\\${cmd}{${val}}`;
            }
            // Commands with space-separated parameters (hrule height 1pt, vrule width 2em)
            return `\\${cmd} ${val}`;
        });

        // 3. Entity Decoding & Final Cleaning

        // Handle common Tiptap-generated tags like <code>, <span>, or generic div/br
        latex = latex.replace(/<br\s*\/?>/g, '\\\\\n');
        latex = latex.replace(/<code>(.*?)<\/code>/g, '$1');
        latex = latex.replace(/<span>(.*?)<\/span>/g, '$1');

        // IMPROVED: Replace remaining HTML tags with empty string (safer than blind strip)
        // This handles any tags Tiptap might add that we didn't explicitly process
        latex = latex.replace(/<[^>]*>/g, '');

        // Decode HTML entities (critical for Tiptap results)
        latex = latex.replace(/&amp;/g, '&');
        latex = latex.replace(/&lt;/g, '<');
        latex = latex.replace(/&gt;/g, '>');
        latex = latex.replace(/&quot;/g, '"');
        latex = latex.replace(/&#39;/g, "'");
        latex = latex.replace(/&nbsp;/g, ' ');

        // Clean up: avoid "\\ \n\n" which can cause "There's no line here to end"
        latex = latex.replace(/\\\\\s*\n\s*\n/g, '\\\\\n');

        // Restore single newlines after comments if they were messed up
        latex = latex.replace(/%\n(.*?)\n/g, '%$1\n');

        return latex;
    }
}
