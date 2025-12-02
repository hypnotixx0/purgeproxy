class Browser {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.nextTabId = 1;
        this.tabsBar = document.getElementById('tabs-bar');
        this.contentArea = document.getElementById('content-area');
        this.urlInput = document.getElementById('url-input');
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        // Proxies to try
        this.proxies = [
            {
                name: 'Lunaar Scramjet',
                url: (encodedUrl) => `https://lunaar.org/scramjet/${encodedUrl}`
            },
            {
                name: 'KCC Scramjet',
                url: (encodedUrl) => `https://kcc.asistdoc.ar/scramjet/${encodedUrl}`
            },
            {
                name: 'OnlineOSDev',
                url: (encodedUrl) => `https://onlineosdev.nl/scramjet/${encodedUrl}`
            }
        ];
        this.currentProxy = 0;
        
        this.embedMethods = ['srcdoc', 'object', 'embed', 'iframe'];
        this.currentMethod = 0;
        
        this.init();
    }
    
    init() {
        console.log('Initializing Browser with advanced embedding...');
        
        // Create add tab button
        const addTabBtn = document.createElement('div');
        addTabBtn.className = 'add-tab';
        addTabBtn.id = 'add-tab-btn';
        addTabBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addTabBtn.addEventListener('click', () => this.createTab());
        this.tabsBar.appendChild(addTabBtn);
        
        // Create first tab
        this.createTab();
        
        // Setup event listeners
        document.getElementById('go-btn').addEventListener('click', () => this.navigate());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.navigate();
        });
        
        document.getElementById('back-btn').addEventListener('click', () => this.goBack());
        document.getElementById('forward-btn').addEventListener('click', () => this.goForward());
        document.getElementById('refresh-btn').addEventListener('click', () => this.refresh());
        document.getElementById('home-btn').addEventListener('click', () => this.goHome());
        
        this.setupGlobalListeners();
    }
    
    setupGlobalListeners() {
        // Handle quick link clicks
        document.addEventListener('click', (e) => {
            const quickLink = e.target.closest('.quick-link');
            if (quickLink) {
                e.preventDefault();
                const url = quickLink.getAttribute('data-url');
                const activeTab = this.getActiveTab();
                if (activeTab) {
                    this.loadUrlInTab(activeTab.id, url);
                }
            }
        });
        
        // Handle new tab page search
        document.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('new-tab-input') && e.key === 'Enter') {
                const url = e.target.value.trim();
                const activeTab = this.getActiveTab();
                if (activeTab && url) {
                    this.loadUrlInTab(activeTab.id, url);
                }
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+T for new tab
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.createTab();
            }
            
            // Ctrl+L to focus address bar
            if ((e.ctrlKey && e.key === 'l') || (e.altKey && e.key === 'd')) {
                e.preventDefault();
                this.urlInput.focus();
                this.urlInput.select();
            }
        });
    }
    
    createTab(url = null) {
        const tabId = this.nextTabId++;
        const tab = {
            id: tabId,
            title: 'New Tab',
            url: url,
            element: null,
            content: null,
            history: [],
            historyIndex: -1,
            isNewTab: !url
        };
        this.tabs.push(tab);
        this.renderTab(tab);
        this.switchToTab(tabId);
        return tab;
    }
    
    renderTab(tab) {
        // Create tab element
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.setAttribute('data-tab-id', tab.id);
        tabElement.innerHTML = `
            <div class="tab-favicon"><i class="fas fa-globe"></i></div>
            <div class="tab-title">${tab.title}</div>
            <button class="tab-close"><i class="fas fa-times"></i></button>
        `;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'browser-frame-container';
        contentElement.id = `tab-content-${tab.id}`;
        
        if (tab.isNewTab) {
            contentElement.innerHTML = this.createNewTabPage();
        } else {
            // Will be filled when loading URL
            contentElement.innerHTML = '<div class="loading-placeholder">Loading...</div>';
        }
        
        this.tabsBar.insertBefore(tabElement, document.getElementById('add-tab-btn'));
        this.contentArea.appendChild(contentElement);
        
        tabElement.addEventListener('click', (e) => {
            if (!e.target.closest('.tab-close')) {
                this.switchToTab(tab.id);
            }
        });
        
        tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });
        
        tab.element = tabElement;
        tab.content = contentElement;
    }
    
    createNewTabPage() {
        return `
            <div class="new-tab-page">
                <div class="new-tab-logo">/Purge</div>
                <p style="color: var(--text); margin-bottom: 2rem; font-size: 1.2rem;">Advanced Proxy Browser</p>
                <div class="new-tab-search">
                    <input type="text" class="new-tab-input" placeholder="Search DuckDuckGo or enter website URL">
                </div>
                <div class="quick-links">
                    <div class="quick-link" data-url="https://duckduckgo.com">
                        <i class="fas fa-search"></i>
                        <div class="quick-link-title">DuckDuckGo</div>
                        <div class="quick-link-desc">Search Engine</div>
                    </div>
                    <div class="quick-link" data-url="https://youtube.com">
                        <i class="fab fa-youtube"></i>
                        <div class="quick-link-title">YouTube</div>
                        <div class="quick-link-desc">Videos</div>
                    </div>
                    <div class="quick-link" data-url="https://github.com">
                        <i class="fab fa-github"></i>
                        <div class="quick-link-title">GitHub</div>
                        <div class="quick-link-desc">Code</div>
                    </div>
                    <div class="quick-link" data-url="https://wikipedia.org">
                        <i class="fab fa-wikipedia-w"></i>
                        <div class="quick-link-title">Wikipedia</div>
                        <div class="quick-link-desc">Encyclopedia</div>
                    </div>
                    <div class="quick-link" data-url="https://reddit.com">
                        <i class="fab fa-reddit"></i>
                        <div class="quick-link-title">Reddit</div>
                        <div class="quick-link-desc">Community</div>
                    </div>
                    <div class="quick-link" data-url="https://discord.com">
                        <i class="fab fa-discord"></i>
                        <div class="quick-link-title">Discord</div>
                        <div class="quick-link-desc">Chat</div>
                    </div>
                </div>
                <div style="margin-top: 2rem; color: var(--text); font-size: 0.9rem; background: rgba(139, 92, 246, 0.1); padding: 1rem; border-radius: 8px; max-width: 600px;">
                    <p><strong>Features:</strong> Multiple embedding methods</p>
                    <p><strong>Proxies:</strong> Scramjet (auto-rotate on failure)</p>
                    <p><strong>Search:</strong> DuckDuckGo with &ia=web</p>
                </div>
            </div>
        `;
    }
    
    switchToTab(tabId) {
        this.tabs.forEach(tab => {
            if (tab.content) tab.content.classList.remove('active');
            if (tab.element) tab.element.classList.remove('active');
        });
        
        const activeTab = this.tabs.find(tab => tab.id === tabId);
        if (activeTab) {
            if (activeTab.content) activeTab.content.classList.add('active');
            if (activeTab.element) activeTab.element.classList.add('active');
            this.activeTabId = tabId;
            
            this.urlInput.value = activeTab.url || '';
        }
        
        this.updateNavButtons();
    }
    
    closeTab(tabId) {
        if (this.tabs.length <= 1) return;
        
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;
        
        const tab = this.tabs[tabIndex];
        
        if (tab.element) tab.element.remove();
        if (tab.content) tab.content.remove();
        
        this.tabs.splice(tabIndex, 1);
        
        if (this.activeTabId === tabId) {
            const newActiveTab = this.tabs[Math.max(0, tabIndex - 1)];
            if (newActiveTab) {
                this.switchToTab(newActiveTab.id);
            }
        }
    }
    
    getActiveTab() {
        return this.tabs.find(tab => tab.id === this.activeTabId);
    }
    
    navigate() {
        const url = this.urlInput.value.trim();
        const activeTab = this.getActiveTab();
        
        if (activeTab && url) {
            console.log('Navigating to:', url);
            this.loadUrlInTab(activeTab.id, url);
        }
    }
    
    async loadUrlInTab(tabId, url) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (!tab || !url) return;
        
        this.showLoading();
        
        // Process URL
        let finalUrl = url.trim();
        
        // Handle search queries
        const isSearchQuery = url.includes(' ') || 
                             (!url.includes('.') && !url.includes('://') && !url.startsWith('http'));
        
        if (isSearchQuery) {
            const searchQuery = encodeURIComponent(url);
            finalUrl = `https://duckduckgo.com/?q=${searchQuery}&ia=web`;
            console.log('Converted to search:', finalUrl);
        } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
            console.log('Added protocol:', finalUrl);
        }
        
        tab.url = finalUrl;
        tab.title = this.extractDomain(finalUrl);
        tab.isNewTab = false;
        
        if (tab.element) {
            tab.element.querySelector('.tab-title').textContent = tab.title;
        }
        
        // Try different embedding methods
        await this.tryEmbedding(tabId, finalUrl, tab);
    }
    
    async tryEmbedding(tabId, finalUrl, tab, proxyIndex = 0, methodIndex = 0) {
        const proxy = this.proxies[proxyIndex];
        const method = this.embedMethods[methodIndex];
        const proxyUrl = proxy.url(encodeURIComponent(finalUrl));
        
        console.log(`Trying ${proxy.name} with ${method} embedding`);
        
        try {
            switch(method) {
                case 'srcdoc':
                    await this.embedWithSrcdoc(tabId, proxyUrl, tab);
                    break;
                case 'object':
                    await this.embedWithObject(tabId, proxyUrl, tab);
                    break;
                case 'embed':
                    await this.embedWithEmbedTag(tabId, proxyUrl, tab);
                    break;
                case 'iframe':
                    await this.embedWithIframe(tabId, proxyUrl, tab);
                    break;
            }
            
            // Success
            this.hideLoading();
            this.urlInput.value = finalUrl;
            this.updateHistory(tab, finalUrl);
            console.log(`Success with ${proxy.name} + ${method}`);
            
        } catch (error) {
            console.error(`${proxy.name} + ${method} failed:`, error);
            
            // Try next method or proxy
            const nextMethodIndex = methodIndex + 1;
            const nextProxyIndex = (nextMethodIndex >= this.embedMethods.length) ? proxyIndex + 1 : proxyIndex;
            const nextMethod = (nextMethodIndex >= this.embedMethods.length) ? 0 : nextMethodIndex;
            
            if (nextProxyIndex < this.proxies.length) {
                // Try with next configuration
                setTimeout(() => {
                    this.tryEmbedding(tabId, finalUrl, tab, nextProxyIndex, nextMethod);
                }, 500);
            } else {
                // All methods failed
                this.hideLoading();
                this.showError(tabId, 'All embedding methods failed. The site may block all embedding attempts.');
            }
        }
    }
    
    async embedWithSrcdoc(tabId, proxyUrl, tab) {
        // Try to fetch with CORS proxy first
        const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(proxyUrl)}`;
        
        try {
            const response = await fetch(corsProxyUrl, {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`CORS proxy failed: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Check if page contains embed blocking
            if (html.toLowerCase().includes('embed') || 
                html.toLowerCase().includes('x-frame-options') ||
                html.toLowerCase().includes('skid')) {
                throw new Error('Page contains embed blocking');
            }
            
            const safeHtml = this.escapeHtml(html);
            
            const frameHtml = `
                <iframe class="browser-frame" 
                        id="frame-${tabId}" 
                        srcdoc="${safeHtml}"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                        referrerpolicy="no-referrer"
                        style="width:100%; height:100%; border:none;">
                </iframe>
            `;
            
            this.updateTabContent(tab, frameHtml);
            
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const frame = document.getElementById(`frame-${tabId}`);
                    if (frame && frame.contentWindow) {
                        resolve();
                    } else {
                        reject('Frame not loaded');
                    }
                }, 2000);
            });
            
        } catch (error) {
            console.log('srcdoc method failed:', error);
            throw error;
        }
    }
    
    embedWithObject(tabId, proxyUrl, tab) {
        // Object tag (sometimes bypasses restrictions)
        const objectHtml = `
            <object class="browser-frame" 
                    id="frame-${tabId}" 
                    data="${proxyUrl}"
                    type="text/html"
                    style="width:100%; height:100%; border:none;">
                <p>Your browser does not support objects.</p>
            </object>
        `;
        
        this.updateTabContent(tab, objectHtml);
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const obj = document.getElementById(`frame-${tabId}`);
                if (obj) {
                    resolve();
                } else {
                    reject('Object not loaded');
                }
            }, 2000);
        });
    }
    
    embedWithEmbedTag(tabId, proxyUrl, tab) {
        // Embed tag (alternative to iframe)
        const embedHtml = `
            <embed class="browser-frame" 
                   id="frame-${tabId}" 
                   src="${proxyUrl}"
                   type="text/html"
                   style="width:100%; height:100%;">
        `;
        
        this.updateTabContent(tab, embedHtml);
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const embed = document.getElementById(`frame-${tabId}`);
                if (embed) {
                    resolve();
                } else {
                    reject('Embed not loaded');
                }
            }, 2000);
        });
    }
    
    embedWithIframe(tabId, proxyUrl, tab) {
        // Regular iframe with different attributes
        const iframeHtml = `
            <iframe class="browser-frame" 
                    id="frame-${tabId}" 
                    src="${proxyUrl}"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                    referrerpolicy="no-referrer"
                    frameborder="0"
                    scrolling="auto"
                    allow="fullscreen *"
                    style="width:100%; height:100%; border:none;">
            </iframe>
        `;
        
        this.updateTabContent(tab, iframeHtml);
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const frame = document.getElementById(`frame-${tabId}`);
                if (frame && frame.contentWindow) {
                    resolve();
                } else {
                    reject('Iframe not loaded');
                }
            }, 2000);
        });
    }
    
    updateTabContent(tab, html) {
        if (tab.content.querySelector('.new-tab-page') || tab.content.querySelector('.loading-placeholder')) {
            tab.content.innerHTML = html;
        } else {
            const frame = document.getElementById(`frame-${tab.id}`);
            if (frame) {
                frame.outerHTML = html;
            } else {
                tab.content.innerHTML = html;
            }
        }
    }
    
    escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/`/g, '&#096;')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ');
    }
    
    updateHistory(tab, finalUrl) {
        if (tab.historyIndex === -1 || tab.history[tab.historyIndex] !== finalUrl) {
            tab.history = tab.history.slice(0, tab.historyIndex + 1);
            tab.history.push(finalUrl);
            tab.historyIndex = tab.history.length - 1;
        }
        this.updateNavButtons();
    }
    
    showError(tabId, message) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (tab && tab.content) {
            tab.content.innerHTML = `
                <div class="new-tab-page">
                    <div class="new-tab-logo" style="color: #ef4444;">/Purge</div>
                    <p style="color: var(--text); margin-bottom: 1rem; font-size: 1.2rem;">Embedding Failed</p>
                    <p style="color: var(--text); margin-bottom: 2rem;">${message}</p>
                    <div style="background: rgba(139, 92, 246, 0.1); padding: 1rem; border-radius: 8px; margin: 1rem 0; max-width: 500px;">
                        <p style="color: var(--text); margin-bottom: 0.5rem;"><strong>Try:</strong></p>
                        <ul style="color: var(--text); text-align: left; display: inline-block;">
                            <li>Refresh the page</li>
                            <li>Try a different website</li>
                            <li>Check if the site blocks embedding</li>
                        </ul>
                    </div>
                    <div style="margin-top: 1rem;">
                        <button class="go-btn" onclick="window.browser.refresh()">
                            <i class="fas fa-redo"></i> Try Again
                        </button>
                        <button class="go-btn" onclick="window.browser.goHome()" style="background: var(--background); margin-left: 0.5rem;">
                            <i class="fas fa-home"></i> Home
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            let domain = urlObj.hostname;
            
            // Remove www. prefix
            if (domain.startsWith('www.')) {
                domain = domain.substring(4);
            }
            
            // Truncate if too long
            if (domain.length > 20) {
                domain = domain.substring(0, 17) + '...';
            }
            
            return domain;
        } catch (e) {
            if (url.includes('duckduckgo.com')) {
                return 'DuckDuckGo';
            }
            return 'Website';
        }
    }
    
    showLoading() {
        this.loadingIndicator.classList.add('loading');
    }
    
    hideLoading() {
        this.loadingIndicator.classList.remove('loading');
    }
    
    goBack() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.historyIndex > 0) {
            activeTab.historyIndex--;
            const url = activeTab.history[activeTab.historyIndex];
            this.loadUrlInTab(activeTab.id, url);
        }
    }
    
    goForward() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.historyIndex < activeTab.history.length - 1) {
            activeTab.historyIndex++;
            const url = activeTab.history[activeTab.historyIndex];
            this.loadUrlInTab(activeTab.id, url);
        }
    }
    
    refresh() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.url) {
            this.loadUrlInTab(activeTab.id, activeTab.url);
        }
    }
    
    goHome() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            activeTab.url = null;
            activeTab.title = 'New Tab';
            activeTab.isNewTab = true;
            
            if (activeTab.element) {
                activeTab.element.querySelector('.tab-title').textContent = 'New Tab';
            }
            
            activeTab.content.innerHTML = this.createNewTabPage();
            this.urlInput.value = '';
            
            activeTab.history = [];
            activeTab.historyIndex = -1;
            this.updateNavButtons();
        }
    }
    
    updateNavButtons() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            document.getElementById('back-btn').disabled = activeTab.historyIndex <= 0;
            document.getElementById('forward-btn').disabled = activeTab.historyIndex >= activeTab.history.length - 1;
        }
    }
}

// Initialize browser
document.addEventListener('DOMContentLoaded', () => {
    window.browser = new Browser();
    console.log('Advanced Embedding Browser ready');
});