/**
 * Shared HTML + CSS Automatic Pagination Engine for Pre-Print HTML Preview & Direct Printing.
 *
 * Ensures that whenever a document's body exceeds the printable height of the chosen paper
 * (A4 = 210x297mm, A5 = 148x210mm), the content is cleanly split across discrete physical
 * page sheets (.sheet-page), EACH complete with its own repeated Header, Footer,
 * Persian page counter ("صفحه X از Y"), and optional watermark — both on screen before
 * printing and in the actual Print/PDF output.
 *
 * Uses progressive enhancement (`html.is-paginated`): the source documents remain safely
 * visible by default and are only swapped with the paginated sheets once real non-empty
 * pages are generated, guaranteeing text can never vanish.
 */

import type { DocumentPaperSize } from '../types/bankLetter';

export interface SheetGeometry {
    pageWidthMm: number;
    pageHeightMm: number;
    marginTopMm: number;
    marginSideMm: number;
    marginBottomMm: number;
    /** Printable inner height in print mode (pageHeight - top - bottom - subpixel safety) */
    printableHeightMm: number;
}

export function getSheetGeometry(paperSize: DocumentPaperSize, variant: 'official' | 'leasing' = 'official'): SheetGeometry {
    const isA5 = paperSize === 'A5';
    if (variant === 'leasing') {
        const marginTopMm = isA5 ? 6.5 : 8.5;
        const marginSideMm = isA5 ? 7.5 : 10.5;
        const marginBottomMm = isA5 ? 8.5 : 10.5;
        const pageWidthMm = isA5 ? 148 : 210;
        const pageHeightMm = isA5 ? 210 : 297;
        return {
            pageWidthMm,
            pageHeightMm,
            marginTopMm,
            marginSideMm,
            marginBottomMm,
            printableHeightMm: Number((pageHeightMm - marginTopMm - marginBottomMm - 1.0).toFixed(2))
        };
    }

    const marginTopMm = isA5 ? 8 : 10.5;
    const marginSideMm = isA5 ? 9 : 12.5;
    const marginBottomMm = isA5 ? 9.5 : 12;
    const pageWidthMm = isA5 ? 148 : 210;
    const pageHeightMm = isA5 ? 210 : 297;
    return {
        pageWidthMm,
        pageHeightMm,
        marginTopMm,
        marginSideMm,
        marginBottomMm,
        printableHeightMm: Number((pageHeightMm - marginTopMm - marginBottomMm - 1.0).toFixed(2))
    };
}

export function buildPaginationSheetCss(
    paperSize: DocumentPaperSize,
    variant: 'official' | 'leasing' = 'official',
    showWatermark = true
): string {
    const g = getSheetGeometry(paperSize, variant);
    const isA5 = paperSize === 'A5';

    return `
        @page {
            size: ${paperSize} portrait;
            margin: ${g.marginTopMm}mm ${g.marginSideMm}mm ${g.marginBottomMm}mm ${g.marginSideMm}mm;
        }

        /* Progressive enhancement: source vault stays readable if script hasn't run yet */
        #doc-sources-vault {
            width: 100%;
        }

        .doc-source-unit {
            width: ${g.pageWidthMm}mm;
            max-width: 100%;
            min-height: ${g.pageHeightMm}mm;
            margin: 0 auto 22px;
            background-color: #ffffff;
            padding: ${g.marginTopMm}mm ${g.marginSideMm}mm ${g.marginBottomMm}mm ${g.marginSideMm}mm;
            border-radius: 6px;
            box-shadow: 0 12px 35px -8px rgba(15, 23, 42, 0.24), 0 0 0 1px rgba(148, 163, 184, 0.45);
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        }

        .doc-source-unit .src-body {
            flex: 1 1 auto;
            padding-top: ${isA5 ? '7px' : '10px'};
            padding-bottom: ${isA5 ? '6px' : '8px'};
        }

        .doc-source-unit .src-ftr {
            margin-top: auto;
            padding-top: ${isA5 ? '6px' : '8px'};
        }

        #paginated-pages-root {
            display: none;
            width: 100%;
        }

        html.is-paginated #doc-sources-vault {
            display: none !important;
        }

        html.is-paginated #paginated-pages-root {
            display: block !important;
        }

        #paginated-pages-root.is-measuring {
            zoom: 1 !important;
        }

        .sheet-page {
            width: ${g.pageWidthMm}mm;
            max-width: 100%;
            min-height: ${g.pageHeightMm}mm;
            margin: 0 auto 22px;
            background-color: #ffffff;
            padding: ${g.marginTopMm}mm ${g.marginSideMm}mm ${g.marginBottomMm}mm ${g.marginSideMm}mm;
            border-radius: 6px;
            box-shadow: 0 12px 35px -8px rgba(15, 23, 42, 0.24), 0 0 0 1px rgba(148, 163, 184, 0.45);
            position: relative;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        }

        .sheet-page.cal-sheet {
            height: ${g.pageHeightMm}mm !important;
            min-height: ${g.pageHeightMm}mm !important;
            max-height: ${g.pageHeightMm}mm !important;
            zoom: 1 !important;
            overflow: hidden !important;
        }

        .sheet-page.doc-page-break {
            page-break-after: always;
            break-after: page;
        }

        .sheet-page-watermark {
            display: ${showWatermark ? 'flex' : 'none'};
            position: absolute;
            inset: 0;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            user-select: none;
            z-index: 0;
            opacity: 0.032;
        }

        .sheet-header-slot {
            position: relative;
            z-index: 1;
            flex: 0 0 auto;
        }

        /* CRITICAL: flex: 0 0 auto keeps body at natural height so scrollHeight measures content accurately! */
        .sheet-body-slot {
            position: relative;
            z-index: 1;
            flex: 0 0 auto;
            padding-top: ${isA5 ? '7px' : '10px'};
            padding-bottom: ${isA5 ? '6px' : '8px'};
            overflow: visible;
        }

        /* margin-top: auto pins the footer cleanly to the bottom of every page */
        .sheet-footer-slot {
            position: relative;
            z-index: 1;
            flex: 0 0 auto;
            margin-top: auto;
            padding-top: ${isA5 ? '6px' : '8px'};
        }

        .continued-box {
            margin-top: 2px !important;
        }

        .continuation-pill {
            display: inline-block;
            font-size: ${isA5 ? '6.8pt' : '7.5pt'};
            font-weight: 800;
            color: #475569;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 0 6px;
            margin-right: 6px;
        }

        .sheet-page-num-badge {
            font-weight: 800;
            color: #1e293b;
        }

        @media print {
            html, body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
            }

            #paginated-pages-root {
                zoom: 1 !important;
            }

            .doc-source-unit {
                width: 100% !important;
                max-width: 100% !important;
                min-height: ${g.printableHeightMm}mm !important;
                margin: 0 !important;
                padding: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                page-break-after: always;
            }

            .sheet-page {
                width: 100% !important;
                max-width: 100% !important;
                height: ${g.printableHeightMm}mm !important;
                min-height: ${g.printableHeightMm}mm !important;
                max-height: ${g.printableHeightMm}mm !important;
                margin: 0 !important;
                padding: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                zoom: 1 !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
            }

            .sheet-page.doc-page-break {
                page-break-after: always !important;
                break-after: page !important;
            }

            .sheet-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
            }
        }
    `;
}

/**
 * Self-contained browser DOM pagination script.
 * Reads all `.doc-source-unit` blocks from `#doc-sources-vault` and renders exact
 * multi-page `.sheet-page` elements into `#paginated-pages-root`, creating a fresh
 * Header and Footer on every overflow page.
 */
export function buildAutoPaginationScript(
    watermarkInnerHtml: string,
    paperSize: DocumentPaperSize = 'A4',
    variant: 'official' | 'leasing' = 'official'
): string {
    const safeWatermarkJson = JSON.stringify(watermarkInnerHtml);
    const geom = getSheetGeometry(paperSize, variant);

    return `
<script>
(function() {
    var WATERMARK_HTML = ${safeWatermarkJson};
    var FALLBACK_PRINTABLE_PX = ${Math.round((geom.printableHeightMm * 96) / 25.4)};
    var FA_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];

    function toFaDigits(val) {
        return String(val).replace(/\\d/g, function(d) { return FA_DIGITS[Number(d)]; });
    }

    function isBlockTag(tag) {
        return /^(P|DIV|TABLE|UL|OL|LI|SECTION|ARTICLE|HEADER|FOOTER|H[1-6]|BLOCKQUOTE|HR)$/i.test(tag || '');
    }

    function isAtomicElement(el) {
        if (!el || el.nodeType !== 1) return false;
        if (/^(H[1-6]|HR|IMG|SVG)$/i.test(el.tagName)) return true;
        if (el.style && (el.style.display === 'flex' || el.style.display === 'grid')) return true;
        var cls = el.classList;
        if (!cls) return false;
        return (
            cls.contains('avoid-break') ||
            cls.contains('signature-grid') ||
            cls.contains('bank-footer-grid') ||
            cls.contains('sig-grid') ||
            cls.contains('confirm-line') ||
            cls.contains('formula-box') ||
            cls.contains('two-col-grid') ||
            cls.contains('three-col-bar') ||
            cls.contains('sign-split') ||
            cls.contains('check-row') ||
            cls.contains('section-heading') ||
            cls.contains('sec-title') ||
            cls.contains('page-tag')
        );
    }

    function isHeadingElement(el) {
        if (!el || el.nodeType !== 1) return false;
        if (/^H[1-6]$/i.test(el.tagName)) return true;
        var cls = el.classList;
        return cls && (cls.contains('section-heading') || cls.contains('sec-title'));
    }

    function hasBlockChildren(el) {
        if (!el || el.nodeType !== 1) return false;
        for (var i = 0; i < el.children.length; i++) {
            if (isBlockTag(el.children[i].tagName)) return true;
        }
        return false;
    }

    function isNodeMeaningful(node) {
        if (!node) return false;
        if (node.nodeType === 3) return node.nodeValue && node.nodeValue.trim().length > 0;
        if (node.nodeType === 1) {
            if (node.tagName === 'BR') return false;
            if (node.querySelector && node.querySelector('table,img,svg,hr,input,.check-box,.chk-sq')) return true;
            return (node.textContent || '').trim().length > 0 || node.tagName === 'TABLE' || node.tagName === 'HR';
        }
        return false;
    }

    function flattenInlineTokens(rootEl, activeWrappers, out) {
        var nodes = Array.prototype.slice.call(rootEl.childNodes);
        for (var i = 0; i < nodes.length; i++) {
            var child = nodes[i];
            if (child.nodeType === 3) {
                var txt = child.nodeValue || '';
                if (!txt) continue;
                var parts = txt.split(/(\\s+)/);
                for (var p = 0; p < parts.length; p++) {
                    if (parts[p].length > 0) {
                        out.push({ kind: 'text', text: parts[p], wrappers: activeWrappers.slice() });
                    }
                }
            } else if (child.nodeType === 1) {
                if (child.tagName === 'BR') {
                    out.push({ kind: 'br', wrappers: activeWrappers.slice() });
                } else if (
                    (child.classList && (
                        child.classList.contains('pill-inline') ||
                        child.classList.contains('pill-sheba') ||
                        child.classList.contains('pill-car') ||
                        child.classList.contains('check-box') ||
                        child.classList.contains('chk-sq') ||
                        child.classList.contains('ltr')
                    )) ||
                    (!hasBlockChildren(child) && (child.textContent || '').length <= 45)
                ) {
                    out.push({ kind: 'node', node: child.cloneNode(true), wrappers: activeWrappers.slice() });
                } else {
                    var nextWrappers = activeWrappers.concat([child.cloneNode(false)]);
                    flattenInlineTokens(child, nextWrappers, out);
                }
            }
        }
    }

    function wrappersMatch(a, b) {
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function populateFromTokens(targetEl, tokens, startIdx, endIdx, trimEdges) {
        targetEl.innerHTML = '';
        var s = startIdx;
        var e = endIdx;
        if (trimEdges) {
            while (s <= e && (tokens[s].kind === 'br' || (tokens[s].kind === 'text' && !tokens[s].text.trim()))) s++;
            while (e >= s && (tokens[e].kind === 'br' || (tokens[e].kind === 'text' && !tokens[e].text.trim()))) e--;
        }
        if (s > e) return;

        var activeOriginalWrappers = [];
        var activeClonedWrappers = [];
        var currentParent = targetEl;

        for (var idx = s; idx <= e; idx++) {
            var tok = tokens[idx];
            if (!wrappersMatch(activeOriginalWrappers, tok.wrappers)) {
                var commonLen = 0;
                while (
                    commonLen < activeOriginalWrappers.length &&
                    commonLen < tok.wrappers.length &&
                    activeOriginalWrappers[commonLen] === tok.wrappers[commonLen]
                ) {
                    commonLen++;
                }
                while (activeOriginalWrappers.length > commonLen) {
                    activeOriginalWrappers.pop();
                    activeClonedWrappers.pop();
                }
                currentParent = commonLen > 0 ? activeClonedWrappers[commonLen - 1] : targetEl;
                for (var w = commonLen; w < tok.wrappers.length; w++) {
                    var wClone = tok.wrappers[w].cloneNode(false);
                    currentParent.appendChild(wClone);
                    activeOriginalWrappers.push(tok.wrappers[w]);
                    activeClonedWrappers.push(wClone);
                    currentParent = wClone;
                }
            }

            if (tok.kind === 'text') {
                currentParent.appendChild(document.createTextNode(tok.text));
            } else if (tok.kind === 'br') {
                currentParent.appendChild(document.createElement('br'));
            } else if (tok.kind === 'node') {
                currentParent.appendChild(tok.node.cloneNode(true));
            }
        }
    }

    function createSheetPage(headerHtml, footerHtml) {
        var sheet = document.createElement('section');
        sheet.className = 'sheet-page doc-page-break';
        sheet.setAttribute('dir', 'rtl');
        sheet.setAttribute('lang', 'fa');

        var wm = document.createElement('div');
        wm.className = 'sheet-page-watermark';
        wm.setAttribute('aria-hidden', 'true');
        wm.innerHTML = WATERMARK_HTML;
        sheet.appendChild(wm);

        var hdr = document.createElement('div');
        hdr.className = 'sheet-header-slot';
        hdr.innerHTML = headerHtml;
        sheet.appendChild(hdr);

        var body = document.createElement('div');
        body.className = 'sheet-body-slot';
        sheet.appendChild(body);

        var ftr = document.createElement('div');
        ftr.className = 'sheet-footer-slot';
        ftr.innerHTML = footerHtml;
        sheet.appendChild(ftr);

        return { sheet: sheet, hdr: hdr, body: body, ftr: ftr };
    }

    function paginateSingleUnit(unitEl, outputRoot) {
        var hdrEl = unitEl.querySelector('.src-hdr');
        var ftrEl = unitEl.querySelector('.src-ftr');
        var bodyEl = unitEl.querySelector('.src-body');
        if (!bodyEl) return [];

        var headerHtml = hdrEl ? hdrEl.innerHTML : '';
        var footerHtml = ftrEl ? ftrEl.innerHTML : '';

        // Calibrate exact printable body pixel height on an off-screen identical sheet
        var calObj = createSheetPage(headerHtml, footerHtml);
        calObj.sheet.classList.add('cal-sheet');
        calObj.sheet.style.visibility = 'hidden';
        calObj.sheet.style.position = 'absolute';
        calObj.sheet.style.left = '-9999px';
        calObj.sheet.style.top = '0';
        outputRoot.appendChild(calObj.sheet);

        var calStyle = window.getComputedStyle(calObj.sheet);
        var measuredInnerH =
            calObj.sheet.clientHeight -
            (parseFloat(calStyle.paddingTop) || 0) -
            (parseFloat(calStyle.paddingBottom) || 0);
        var innerSheetH = measuredInnerH >= 150 ? measuredInnerH : FALLBACK_PRINTABLE_PX;
        var hdrH = calObj.hdr.offsetHeight || 86;
        var ftrH = calObj.ftr.offsetHeight || 34;
        // body.scrollHeight / body.offsetHeight already include .sheet-body-slot padding
        var maxBodyH = Math.max(160, Math.floor(innerSheetH - hdrH - ftrH - 10));
        outputRoot.removeChild(calObj.sheet);

        var pages = [];
        var currentPage = null;
        var containerChain = []; // original container nodes currently open across pages
        var activeContainerClones = []; // corresponding cloned wrappers on currentPage
        var MAX_PAGES = 150;

        function getCurrentBodyHeight() {
            if (!currentPage) return 0;
            return Math.max(currentPage.body.scrollHeight || 0, currentPage.body.offsetHeight || 0);
        }

        function pruneEmptyWrappersOnCurrentPage() {
            for (var i = activeContainerClones.length - 1; i >= 0; i--) {
                var c = activeContainerClones[i];
                if (c && c.parentNode && c.childNodes.length === 0) {
                    c.parentNode.removeChild(c);
                }
            }
        }

        function startNewPage() {
            if (currentPage) {
                pruneEmptyWrappersOnCurrentPage();
            }
            var pObj = createSheetPage(headerHtml, footerHtml);
            outputRoot.appendChild(pObj.sheet);
            pages.push(pObj);
            currentPage = pObj;

            activeContainerClones = [];
            var parent = pObj.body;
            for (var i = 0; i < containerChain.length; i++) {
                var clone = containerChain[i].cloneNode(false);
                clone.classList.add('continued-box');
                parent.appendChild(clone);
                activeContainerClones.push(clone);
                parent = clone;
            }
            return parent;
        }

        function getActiveTarget() {
            if (!currentPage) return startNewPage();
            return activeContainerClones.length > 0
                ? activeContainerClones[activeContainerClones.length - 1]
                : currentPage.body;
        }

        function fitsCurrentPage() {
            if (!currentPage) return true;
            return getCurrentBodyHeight() <= maxBodyH + 1;
        }

        function isCurrentBodyEffectivelyEmpty() {
            if (!currentPage) return true;
            if (currentPage.body.children.length === 0 && (currentPage.body.textContent || '').trim() === '') return true;
            if ((currentPage.body.textContent || '').trim() === '' && !currentPage.body.querySelector('table,img,svg,hr,.check-box,.chk-sq')) {
                return true;
            }
            return false;
        }

        function detachTrailingOrphanHeading() {
            var target = getActiveTarget();
            if (target && target.lastElementChild && isHeadingElement(target.lastElementChild)) {
                var orphan = target.lastElementChild;
                target.removeChild(orphan);
                return orphan;
            }
            return null;
        }

        function splitTableAcrossPages(tableEl) {
            var thead = tableEl.querySelector('thead');
            var colgroup = tableEl.querySelector('colgroup');
            var origTbody = tableEl.querySelector('tbody');
            var rows = origTbody
                ? Array.prototype.slice.call(origTbody.querySelectorAll(':scope > tr'))
                : Array.prototype.slice.call(tableEl.querySelectorAll('tr'));

            if (rows.length === 0) return;

            function createTableShell() {
                var t = tableEl.cloneNode(false);
                if (colgroup) t.appendChild(colgroup.cloneNode(true));
                if (thead) t.appendChild(thead.cloneNode(true));
                var tb = document.createElement('tbody');
                t.appendChild(tb);
                return { table: t, tbody: tb };
            }

            var target = getActiveTarget();
            var shell = createTableShell();
            target.appendChild(shell.table);

            for (var r = 0; r < rows.length; r++) {
                var rowClone = rows[r].cloneNode(true);
                shell.tbody.appendChild(rowClone);

                if (!fitsCurrentPage()) {
                    shell.tbody.removeChild(rowClone);
                    var hadRowsOnThisPage = shell.tbody.children.length > 0;
                    if (!hadRowsOnThisPage && shell.table.parentNode) {
                        shell.table.parentNode.removeChild(shell.table);
                    }

                    if (pages.length >= MAX_PAGES) {
                        shell.tbody.appendChild(rowClone);
                        continue;
                    }

                    // If current page was already completely empty and even the 1st row overflows, keep it so nothing vanishes
                    if (!hadRowsOnThisPage && isCurrentBodyEffectivelyEmpty()) {
                        target.appendChild(shell.table);
                        shell.tbody.appendChild(rowClone);
                        continue;
                    }

                    var orphanHeading = !hadRowsOnThisPage ? detachTrailingOrphanHeading() : null;
                    target = startNewPage();
                    if (orphanHeading) target.appendChild(orphanHeading);
                    shell = createTableShell();
                    target.appendChild(shell.table);
                    shell.tbody.appendChild(rowClone);
                }
            }
        }

        function splitInlineElementAcrossPages(el, alreadyOnFreshPage) {
            var tokens = [];
            flattenInlineTokens(el, [], tokens);
            if (tokens.length <= 1) {
                var target = getActiveTarget();
                if (!alreadyOnFreshPage && !isCurrentBodyEffectivelyEmpty() && pages.length < MAX_PAGES) {
                    var orphanH = detachTrailingOrphanHeading();
                    target = startNewPage();
                    if (orphanH) target.appendChild(orphanH);
                }
                target.appendChild(el.cloneNode(true));
                return;
            }

            var targetContainer = getActiveTarget();
            var remainingPx = maxBodyH - getCurrentBodyHeight();
            var pageHasContent = !isCurrentBodyEffectivelyEmpty();

            // If very little room left on non-empty page, move cleanly to next page
            if (!alreadyOnFreshPage && pageHasContent && remainingPx < 56 && pages.length < MAX_PAGES) {
                var orphanH2 = detachTrailingOrphanHeading();
                targetContainer = startNewPage();
                if (orphanH2) targetContainer.appendChild(orphanH2);
                var wholeTry = el.cloneNode(true);
                targetContainer.appendChild(wholeTry);
                if (fitsCurrentPage()) return;
                targetContainer.removeChild(wholeTry);
                alreadyOnFreshPage = true;
                pageHasContent = !isCurrentBodyEffectivelyEmpty();
            }

            var shell1 = el.cloneNode(false);
            targetContainer.appendChild(shell1);

            // Binary search largest prefix of tokens[0..mid] that fits
            var lo = 0;
            var hi = tokens.length - 1;
            var best = -1;
            while (lo <= hi) {
                var mid = Math.floor((lo + hi) / 2);
                populateFromTokens(shell1, tokens, 0, mid, true);
                if (fitsCurrentPage()) {
                    best = mid;
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }

            if (best >= 0) {
                populateFromTokens(shell1, tokens, 0, best, true);
            }

            // If we are on a non-empty page and either nothing fits or only a tiny stub fits, push to next page
            if (!alreadyOnFreshPage && pageHasContent && (best < 0 || shell1.offsetHeight < 32) && pages.length < MAX_PAGES) {
                targetContainer.removeChild(shell1);
                var orphanH3 = detachTrailingOrphanHeading();
                var newTarget = startNewPage();
                if (orphanH3) newTarget.appendChild(orphanH3);
                appendNodeAcrossPages(el, true);
                return;
            }

            if (best < 0) {
                // Already on a fresh empty page and even 1 token didn't fit — keep whole element so nothing is ever lost
                targetContainer.removeChild(shell1);
                targetContainer.appendChild(el.cloneNode(true));
                return;
            }

            shell1.style.marginBottom = '0';

            if (best + 1 < tokens.length && pages.length < MAX_PAGES) {
                var restShell = el.cloneNode(false);
                restShell.style.marginTop = '0';
                populateFromTokens(restShell, tokens, best + 1, tokens.length - 1, true);
                if (isNodeMeaningful(restShell)) {
                    startNewPage();
                    appendNodeAcrossPages(restShell, true);
                }
            }
        }

        function appendNodeAcrossPages(node, alreadyOnFreshPage) {
            if (!isNodeMeaningful(node)) return;
            if (pages.length >= MAX_PAGES) {
                getActiveTarget().appendChild(node.cloneNode(true));
                return;
            }

            var target = getActiveTarget();
            var clone = node.cloneNode(true);
            target.appendChild(clone);

            if (fitsCurrentPage()) {
                return;
            }

            target.removeChild(clone);
            var pageHasContent = !isCurrentBodyEffectivelyEmpty();

            if (node.nodeType === 1 && node.tagName === 'TABLE') {
                splitTableAcrossPages(node);
                return;
            }

            if (isAtomicElement(node)) {
                if (!alreadyOnFreshPage && pageHasContent && pages.length < MAX_PAGES) {
                    var orphanH = detachTrailingOrphanHeading();
                    target = startNewPage();
                    if (orphanH) target.appendChild(orphanH);
                    target.appendChild(node.cloneNode(true));
                } else {
                    target.appendChild(node.cloneNode(true));
                }
                return;
            }

            if (node.nodeType === 1 && hasBlockChildren(node)) {
                var remainingPx = maxBodyH - getCurrentBodyHeight();
                if (!alreadyOnFreshPage && pageHasContent && remainingPx < 105 && pages.length < MAX_PAGES) {
                    var orphanH2 = detachTrailingOrphanHeading();
                    var nextTarget = startNewPage();
                    if (orphanH2) nextTarget.appendChild(orphanH2);
                    appendNodeAcrossPages(node, true);
                    return;
                }

                var wrapperShell = node.cloneNode(false);
                target.appendChild(wrapperShell);
                containerChain.push(node);
                activeContainerClones.push(wrapperShell);

                var kids = Array.prototype.slice.call(node.childNodes);
                for (var k = 0; k < kids.length; k++) {
                    appendNodeAcrossPages(kids[k], false);
                }

                containerChain.pop();
                var poppedClone = activeContainerClones.pop();
                if (poppedClone && poppedClone.parentNode && poppedClone.childNodes.length === 0) {
                    poppedClone.parentNode.removeChild(poppedClone);
                }
                return;
            }

            if (node.nodeType === 1) {
                splitInlineElementAcrossPages(node, alreadyOnFreshPage);
                return;
            }

            if (!alreadyOnFreshPage && pageHasContent && pages.length < MAX_PAGES) {
                target = startNewPage();
            }
            target.appendChild(node.cloneNode(true));
        }

        startNewPage();

        var topNodes = Array.prototype.slice.call(bodyEl.childNodes);
        for (var i = 0; i < topNodes.length; i++) {
            appendNodeAcrossPages(topNodes[i], false);
        }

        // Remove any accidental empty trailing sheet
        while (pages.length > 1) {
            var lastP = pages[pages.length - 1];
            var hasVisual = (lastP.body.textContent || '').trim().length > 0 || lastP.body.querySelector('table,img,svg,hr,.check-box,.chk-sq');
            if (!hasVisual) {
                outputRoot.removeChild(lastP.sheet);
                pages.pop();
            } else {
                break;
            }
        }

        // Update page numbers inside EVERY page's footer and continuation badge on Page 2+
        var totalPages = pages.length;
        for (var pIdx = 0; pIdx < totalPages; pIdx++) {
            var pageNo = pIdx + 1;
            var pg = pages[pIdx];
            pg.ftr.innerHTML = pg.ftr.innerHTML
                .replace(/\\{\\{DOC_PAGE\\}\\}/g, toFaDigits(pageNo))
                .replace(/\\{\\{DOC_PAGES\\}\\}/g, toFaDigits(totalPages));

            if (pIdx > 0) {
                var subEl = pg.hdr.querySelector('.doc-subtitle, .l-subtitle');
                if (subEl && !subEl.querySelector('.continuation-pill')) {
                    var badge = document.createElement('span');
                    badge.className = 'continuation-pill';
                    badge.textContent = 'ادامه — صفحه ' + toFaDigits(pageNo) + ' از ' + toFaDigits(totalPages);
                    subEl.appendChild(badge);
                }
            }
        }

        return pages;
    }

    function populateFallbackPageNumbers(vault) {
        var units = Array.prototype.slice.call(vault.querySelectorAll('.doc-source-unit'));
        for (var u = 0; u < units.length; u++) {
            var ftr = units[u].querySelector('.src-ftr');
            if (ftr) {
                ftr.innerHTML = ftr.innerHTML
                    .replace(/\\{\\{DOC_PAGE\\}\\}/g, toFaDigits(1))
                    .replace(/\\{\\{DOC_PAGES\\}\\}/g, toFaDigits(1));
            }
        }
    }

    function paginateAllDocuments() {
        var vault = document.getElementById('doc-sources-vault');
        var root = document.getElementById('paginated-pages-root');
        if (!vault || !root) return;

        try {
            document.documentElement.classList.add('is-paginated');
            root.classList.add('is-measuring');
            root.innerHTML = '';

            var units = Array.prototype.slice.call(vault.querySelectorAll('.doc-source-unit'));
            var allSheets = [];

            for (var u = 0; u < units.length; u++) {
                var unitPages = paginateSingleUnit(units[u], root);
                for (var p = 0; p < unitPages.length; p++) {
                    allSheets.push(unitPages[p].sheet);
                }
            }

            root.classList.remove('is-measuring');

            var hasRenderedText = false;
            for (var s = 0; s < allSheets.length; s++) {
                if ((allSheets[s].textContent || '').trim().length > 0) {
                    hasRenderedText = true;
                }
                if (s === allSheets.length - 1) {
                    allSheets[s].classList.remove('doc-page-break');
                } else {
                    allSheets[s].classList.add('doc-page-break');
                }
            }

            if (allSheets.length === 0 || !hasRenderedText) {
                document.documentElement.classList.remove('is-paginated');
                populateFallbackPageNumbers(vault);
            }
        } catch (err) {
            console.error('Auto-pagination error:', err);
            root.classList.remove('is-measuring');
            document.documentElement.classList.remove('is-paginated');
            populateFallbackPageNumbers(vault);
        }
    }

    window.__paginateAllDocuments = paginateAllDocuments;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', paginateAllDocuments);
    } else {
        paginateAllDocuments();
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() {
            setTimeout(paginateAllDocuments, 30);
        });
    }

    window.addEventListener('beforeprint', paginateAllDocuments);
})();
</script>
`;
}
