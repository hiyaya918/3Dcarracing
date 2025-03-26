// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 为游戏瓷砖添加悬停时显示名称的功能
    const gameTiles = document.querySelectorAll('.game-tile');
    const gameModal = document.getElementById('gameModal');
    const gameIframe = document.getElementById('gameIframe');
    const gameTitle = document.getElementById('gameTitle');
    const closeButton = document.getElementById('closeButton');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const gameContainer = document.querySelector('.game-container');
    const fullscreenButton = document.getElementById('fullscreenButton');
    
    // 游戏URL和对应的游戏名称映射
    const gameData = {
        'https://microstudio.io/Skaruts/sk_pseudo3d_racing/': '3D赛车模拟',
        'https://microstudio.io/gilles/racingdemo/': '赛车演示',
        'https://microstudio.io/KOOLSKULL/2k4dracer/': '2K4D赛车',
        'https://microstudio.io/jaysnjj/nightdrive/': '夜间驾驶',
        'https://racing.pmnd.rs/': '3D赛车',
        'https://hexgl.bkcore.com/play/': 'HexGL'
    };
    
    // 一些游戏可能不允许在iframe中嵌入，为这些游戏提供多个替代URL
    const alternativeGameUrls = {
        'https://racing.pmnd.rs/': [
            'https://play.racing.pmnd.rs/',
            'https://racing.pmnd.rs/game/',
            'https://racing.pmnd.rs/index.html'
        ],
        'https://hexgl.bkcore.com/play/': [
            'https://hexgl.bkcore.com/play/index.html?webgl=true',
            'https://hexgl.bkcore.com/play/index.html',
            'https://hexgl.bkcore.com/play/default.html'
        ],
        'https://microstudio.io/Skaruts/sk_pseudo3d_racing/': [
            'https://microstudio.io/Skaruts/sk_pseudo3d_racing/play/',
            'https://microstudio.io/Skaruts/sk_pseudo3d_racing/index.html',
            'https://microstudio.io/Skaruts/sk_pseudo3d_racing/game/'
        ],
        'https://microstudio.io/gilles/racingdemo/': [
            'https://microstudio.io/gilles/racingdemo/play/',
            'https://microstudio.io/gilles/racingdemo/index.html',
            'https://microstudio.io/gilles/racingdemo/game/'
        ],
        'https://microstudio.io/KOOLSKULL/2k4dracer/': [
            'https://microstudio.io/KOOLSKULL/2k4dracer/play/',
            'https://microstudio.io/KOOLSKULL/2k4dracer/index.html',
            'https://microstudio.io/KOOLSKULL/2k4dracer/game/'
        ],
        'https://microstudio.io/jaysnjj/nightdrive/': [
            'https://microstudio.io/jaysnjj/nightdrive/play/',
            'https://microstudio.io/jaysnjj/nightdrive/index.html',
            'https://microstudio.io/jaysnjj/nightdrive/game/'
        ]
    };
    
    gameTiles.forEach(tile => {
        const gameLink = tile.querySelector('.game-link');
        const gameImage = tile.querySelector('.game-image');
        
        if (gameImage && gameImage.alt) {
            tile.setAttribute('data-name', gameImage.alt);
        }
        
        // 游戏点击事件
        tile.addEventListener('click', function(e) {
            // 只有点击游戏图片或链接才触发游戏加载
            if (e.target === gameImage || e.target === gameLink || e.target.closest('.game-link')) {
                e.preventDefault();
                const gameName = gameImage.alt;
                const gameUrl = tile.getAttribute('data-game-url');
                
                if (gameUrl) {
                    // 在iframe中加载游戏
                    loadGame(gameUrl, gameName);
                } else {
                    alert(`您选择了游戏：${gameName}\n游戏将在此处加载。`);
                }
            }
        });
    });
    
    // 加载游戏函数
    function loadGame(gameUrl, gameName) {
        console.log('开始加载游戏:', gameUrl);
        
        // 显示加载中状态
        loadingSpinner.style.display = 'block';
        gameTitle.textContent = gameName || '游戏加载中...';
        
        // 确保使用HTTPS
        let finalUrl = gameUrl.replace('http://', 'https://');
        
        // 检查是否有替代URL
        const altUrls = alternativeGameUrls[gameUrl];
        if (altUrls && Array.isArray(altUrls)) {
            finalUrl = altUrls[0]; // 默认使用第一个替代URL
            console.log('使用替代URL:', finalUrl);
        }
        
        // 确保iframe恢复显示状态
        gameIframe.style.display = 'block';
        
        // 移除可能存在的错误消息
        const errorMsg = document.querySelector('.game-error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
        
        // 重置sandbox移除标志
        window.sandboxRemoved = false;
        window.currentAltUrlIndex = 0;
        
        // 扩展iframe的sandbox属性以允许更多权限
        gameIframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock allow-top-navigation allow-top-navigation-by-user-activation allow-modals allow-presentation allow-orientation-lock allow-downloads');
        
        // 设置iframe源
        try {
            // 尝试直接加载游戏URL
            gameIframe.src = finalUrl;
            
            // 显示游戏弹窗
            gameModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // 防止背景滚动
            
            // 监听iframe加载完成事件
            gameIframe.onload = function() {
                console.log('游戏iframe加载完成');
                // 隐藏加载动画
                loadingSpinner.style.display = 'none';
                
                // 尝试与iframe内容通信，检查是否真正加载了游戏
                try {
                    let loaded = false;
                    if (gameIframe.contentWindow && gameIframe.contentWindow.document) {
                        loaded = true;
                    }
                    console.log('游戏内容加载状态:', loaded ? '成功' : '可能有问题');
                    
                    // 如果加载可能有问题，等待一段时间后检查游戏是否真正运行
                    if (!loaded) {
                        setTimeout(() => {
                            if (!gameIframe.contentWindow || !gameIframe.contentWindow.document) {
                                handleLoadError(gameUrl, gameName, true);
                            }
                        }, 3000);
                    }
                } catch (e) {
                    console.warn('无法检查iframe内容 (可能是跨域限制):', e);
                    // 即使有跨域错误，游戏仍可能正常加载，继续等待
                }
            };
            
            // 监听iframe加载错误
            gameIframe.onerror = function(error) {
                console.error('游戏iframe加载失败:', error);
                handleLoadError(gameUrl, gameName);
            };
            
            // 设置一个超时检查，确保游戏加载成功
            setTimeout(function() {
                if (loadingSpinner.style.display === 'block') {
                    console.log('游戏加载超时，尝试备用方案');
                    handleLoadError(gameUrl, gameName, true);
                }
            }, 10000);
        } catch (error) {
            console.error('加载游戏时出错:', error);
            handleLoadError(gameUrl, gameName);
        }
    }
    
    // 处理游戏加载错误
    function handleLoadError(gameUrl, gameName, isTimeout) {
        const altUrls = alternativeGameUrls[gameUrl];
        
        // 如果有替代URL并且还没有尝试完所有的URL
        if (altUrls && Array.isArray(altUrls)) {
            window.currentAltUrlIndex = (window.currentAltUrlIndex || 0) + 1;
            if (window.currentAltUrlIndex < altUrls.length) {
                console.log(`尝试使用第${window.currentAltUrlIndex + 1}个替代URL:`, altUrls[window.currentAltUrlIndex]);
                gameIframe.src = altUrls[window.currentAltUrlIndex];
                
                // 给新URL一些时间加载
                setTimeout(function() {
                    if (loadingSpinner.style.display === 'block') {
                        // 如果还是没有加载成功，继续尝试下一个URL
                        handleLoadError(gameUrl, gameName, true);
                    }
                }, 5000);
                return;
            }
        }
        
        // 如果所有替代URL都失败了，尝试移除sandbox
        if (!window.sandboxRemoved) {
            window.sandboxRemoved = true;
            console.log('尝试移除sandbox限制...');
            gameIframe.removeAttribute('sandbox');
            
            // 重新加载当前URL
            const currentUrl = gameIframe.src;
            gameIframe.src = currentUrl;
            
            // 再给一次机会加载
            setTimeout(function() {
                if (loadingSpinner.style.display === 'block') {
                    // 真的加载失败了，显示错误信息
                    showErrorMessage(gameUrl, gameName, isTimeout);
                }
            }, 5000);
            return;
        }
        
        showErrorMessage(gameUrl, gameName, isTimeout);
    }
    
    // 显示错误信息
    function showErrorMessage(gameUrl, gameName, isTimeout) {
        // 隐藏加载动画
        loadingSpinner.style.display = 'none';
        
        // 显示错误信息
        gameTitle.textContent = `${gameName} - ${isTimeout ? '加载超时' : '加载失败'}`;
        
        // 创建一个提示
        const errorMsg = document.createElement('div');
        errorMsg.className = 'game-error-message';
        errorMsg.innerHTML = `
            <p>游戏加载失败，可能由于以下原因：</p>
            <ul>
                <li>该游戏不允许在iframe中嵌入</li>
                <li>网络连接问题</li>
                <li>游戏源已更改</li>
            </ul>
            <button id="openNewWindow" class="error-action-button">在新窗口中打开</button>
            <button id="tryAgain" class="error-action-button">重试</button>
        `;
        
        // 清除iframe内容并添加错误信息
        gameIframe.style.display = 'none';
        gameContainer.appendChild(errorMsg);
        
        // 为新窗口打开按钮添加事件
        document.getElementById('openNewWindow').addEventListener('click', function() {
            window.open(gameUrl, '_blank');
            closeGame();
        });
        
        // 为重试按钮添加事件
        document.getElementById('tryAgain').addEventListener('click', function() {
            // 移除错误消息
            errorMsg.remove();
            // 重置sandbox移除标志
            window.sandboxRemoved = false;
            // 重新加载游戏
            loadGame(gameUrl, gameName);
        });
    }
    
    // 全屏按钮点击事件
    fullscreenButton.addEventListener('click', function() {
        if (gameIframe.requestFullscreen) {
            gameIframe.requestFullscreen();
        } else if (gameIframe.mozRequestFullScreen) { // Firefox
            gameIframe.mozRequestFullScreen();
        } else if (gameIframe.webkitRequestFullscreen) { // Chrome, Safari
            gameIframe.webkitRequestFullscreen();
        } else if (gameIframe.msRequestFullscreen) { // IE/Edge
            gameIframe.msRequestFullscreen();
        }
    });
    
    // 关闭按钮点击事件
    closeButton.addEventListener('click', function() {
        closeGame();
    });
    
    // 点击模态框背景关闭游戏
    gameModal.addEventListener('click', function(e) {
        if (e.target === gameModal) {
            closeGame();
        }
    });
    
    // ESC键关闭游戏
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && gameModal.classList.contains('active')) {
            closeGame();
        }
    });
    
    // 关闭游戏函数
    function closeGame() {
        gameModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // 延迟清除iframe源，避免声音继续播放
        setTimeout(() => {
            gameIframe.src = '';
            loadingSpinner.style.display = 'block';
            
            // 恢复iframe显示
            gameIframe.style.display = 'block';
            
            // 移除可能存在的错误消息
            const errorMsg = document.querySelector('.game-error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
            
            // 重置sandbox移除标志
            window.sandboxRemoved = false;
        }, 300);
    }
    
    // 游戏关键词标签点击事件
    const keywordTags = document.querySelectorAll('.keyword-tag');
    
    keywordTags.forEach(tag => {
        tag.addEventListener('click', function(e) {
            e.preventDefault();
            const keyword = this.textContent.trim();
            
            // 如果当前标签已经被激活，则取消激活并重置显示
            if (this.classList.contains('active')) {
                // 取消激活
                this.classList.remove('active');
                // 重置所有游戏显示
                resetGamesDisplay();
                return;
            }
            
            // 高亮选中的标签
            keywordTags.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 根据关键词筛选和显示游戏
            filterGamesByKeyword(keyword);
        });
    });
    
    // 根据关键词筛选游戏
    function filterGamesByKeyword(keyword) {
        // 获取所有游戏区域
        const gameSections = document.querySelectorAll('.game-section');
        
        // 先隐藏所有游戏
        gameSections.forEach(section => {
            section.style.display = 'none';  // 完全隐藏不匹配的游戏
        });
        
        let matchFound = false;
        
        // 遍历所有游戏区域，检查游戏标题是否包含关键词
        gameSections.forEach(section => {
            const titleElement = section.querySelector('.game-title');
            if (titleElement) {
                const gameTitle = titleElement.textContent.toLowerCase();
                if (gameTitle.includes(keyword.toLowerCase())) {
                    // 匹配的游戏显示并高亮
                    section.style.display = '';  // 恢复原来的显示状态
                    section.style.opacity = '1';
                    section.classList.add('highlight-effect');
                    setTimeout(() => {
                        section.classList.remove('highlight-effect');
                    }, 1500);
                    
                    // 滚动到第一个匹配的游戏
                    if (!matchFound) {
                        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        matchFound = true;
                    }
                }
            }
        });
        
        // 如果没有找到匹配的游戏，显示提示消息
        if (!matchFound) {
            showNotification(`没有找到与"${keyword}"相关的游戏`, 'info');
            
            // 显示一个更明显的空状态提示
            showEmptyState(keyword);
            
            // 移除标签激活状态
            keywordTags.forEach(t => t.classList.remove('active'));
        } else {
            // 如果有匹配的游戏，移除可能存在的空状态提示
            removeEmptyState();
        }
    }
    
    // 显示空状态提示
    function showEmptyState(keyword) {
        // 移除可能已存在的空状态提示
        removeEmptyState();
        
        // 创建空状态提示元素
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state-message';
        emptyState.innerHTML = `
            <div class="empty-icon">🔍</div>
            <h3>没有找到与"${keyword}"相关的游戏</h3>
            <p>我们正在努力添加更多游戏，敬请期待！</p>
            <button class="reset-filter-btn">显示所有游戏</button>
        `;
        
        // 将空状态提示添加到游戏区域
        const gamesContainer = document.querySelector('.games-direct');
        if (gamesContainer) {
            gamesContainer.appendChild(emptyState);
            
            // 为"显示所有游戏"按钮添加点击事件
            const resetBtn = emptyState.querySelector('.reset-filter-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', function() {
                    // 重置所有标签和游戏显示
                    keywordTags.forEach(t => t.classList.remove('active'));
                    resetGamesDisplay();
                    removeEmptyState();
                });
            }
        }
    }
    
    // 移除空状态提示
    function removeEmptyState() {
        const emptyState = document.querySelector('.empty-state-message');
        if (emptyState) {
            emptyState.remove();
        }
    }
    
    // 重置所有游戏显示
    function resetGamesDisplay() {
        const gameSections = document.querySelectorAll('.game-section');
        gameSections.forEach(section => {
            section.style.opacity = '1';
            section.style.display = '';  // 恢复默认显示状态
        });
        
        // 移除空状态提示
        removeEmptyState();
    }
    
    // 显示通知消息
    function showNotification(message, type = 'info') {
        // 检查是否已存在通知
        let notification = document.querySelector('.search-notification');
        
        // 如果已存在通知，先移除
        if (notification) {
            notification.remove();
        }
        
        // 创建新通知
        notification = document.createElement('div');
        notification.className = `search-notification ${type}`;
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 自动消失
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // 信息区域的链接点击
    const infoLinks = document.querySelectorAll('.info-section li');
    
    infoLinks.forEach(link => {
        link.addEventListener('click', function() {
            this.classList.add('link-clicked');
            setTimeout(() => {
                this.classList.remove('link-clicked');
            }, 500);
        });
    });
    
    // 页面加载动画
    const wrapper = document.querySelector('.wrapper');
    
    if (wrapper) {
        wrapper.style.opacity = '0';
        setTimeout(() => {
            wrapper.style.transition = 'opacity 0.8s ease';
            wrapper.style.opacity = '1';
        }, 100);
    }
    
    // 为游戏瓷砖添加动画效果
    animateGameTiles();
    
    function animateGameTiles() {
        // 为游戏瓷砖依次添加出现动画
        gameTiles.forEach((tile, index) => {
            tile.style.opacity = '0';
            tile.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                tile.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                tile.style.opacity = '1';
                tile.style.transform = '';
            }, 100 + index * 100);
        });
    }
    
    // 随机为少数游戏瓷砖添加特殊动画效果
    function addRandomEffects() {
        const randomTiles = Array.from(gameTiles).sort(() => 0.5 - Math.random()).slice(0, 2);
        
        randomTiles.forEach(tile => {
            tile.classList.add('pulse-effect');
            
            setTimeout(() => {
                tile.classList.remove('pulse-effect');
            }, 1500);
        });
        
        setTimeout(addRandomEffects, 3000);
    }
    
    // 启动随机效果
    setTimeout(addRandomEffects, 2000);
    
    // 开发者信息模态框功能
    const overlay = document.getElementById('modal-overlay');
    const submitGameLink = document.getElementById('submit-game');
    const contactUsLink = document.getElementById('contact-us');
    
    const submitGameModal = document.getElementById('submit-game-modal');
    const contactModal = document.getElementById('contact-modal');
    
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    
    // 打开提交游戏模态框
    if (submitGameLink) {
        submitGameLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(submitGameModal);
        });
    }
    
    // 打开联系我们模态框
    if (contactUsLink) {
        contactUsLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(contactModal);
        });
    }
    
    // 关闭按钮事件
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // 点击遮罩层关闭模态框
    if (overlay) {
        overlay.addEventListener('click', closeAllModals);
    }
    
    // 按ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // 打开模态框函数
    function openModal(modal) {
        if (overlay && modal) {
            overlay.style.display = 'block';
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // 禁止背景滚动
        }
    }
    
    // 关闭所有模态框函数
    function closeAllModals() {
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        const modals = document.querySelectorAll('.dev-modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        document.body.style.overflow = ''; // 恢复背景滚动
    }
    
    // 联系表单提交处理
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // 这里可以添加表单数据处理和发送逻辑
            alert('感谢您的留言！我们会尽快回复您。');
            contactForm.reset();
            closeAllModals();
        });
    }
    
    // 搜索功能实现
    initSearchFunctionality();
});

// 搜索功能初始化
function initSearchFunctionality() {
    const searchInput = document.getElementById('game-search');
    const searchButton = document.getElementById('search-btn');
    const suggestionsContainer = document.getElementById('search-suggestions');
    const keywordTags = document.querySelectorAll('.keyword-tag');
    const gameTiles = document.querySelectorAll('.game-section');
    
    // 获取所有游戏标题和关键词
    const gamesList = [];
    gameTiles.forEach(tile => {
        const titleElement = tile.querySelector('.game-title');
        if (titleElement) {
            gamesList.push({
                title: titleElement.textContent.trim(),
                element: tile
            });
        }
    });
    
    // 从关键词标签收集关键词
    const keywordsList = Array.from(keywordTags).map(tag => tag.textContent.trim());
    
    // 搜索框输入事件
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            
            if (query.length > 0) {
                // 生成建议
                const suggestions = generateSuggestions(query);
                showSuggestions(suggestions, query);
            } else {
                // 隐藏建议
                hideSuggestions();
            }
        });
        
        // 搜索框焦点事件
        searchInput.addEventListener('focus', function() {
            if (this.value.trim().length > 0) {
                const query = this.value.trim().toLowerCase();
                const suggestions = generateSuggestions(query);
                showSuggestions(suggestions, query);
            }
        });
        
        // 回车键搜索
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim().toLowerCase();
                if (query.length > 0) {
                    performSearch(query);
                    hideSuggestions();
                }
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                navigateSuggestions(e.key === 'ArrowDown' ? 1 : -1);
            } else if (e.key === 'Escape') {
                hideSuggestions();
            }
        });
    }
    
    // 点击搜索按钮
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length > 0) {
                performSearch(query);
            }
        });
    }
    
    // 点击其他地方隐藏建议
    if (suggestionsContainer) {
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                hideSuggestions();
            }
        });
    }
    
    // 生成搜索建议
    function generateSuggestions(query) {
        const suggestions = [];
        
        // 添加匹配的游戏
        gamesList.forEach(game => {
            if (game.title.toLowerCase().includes(query)) {
                suggestions.push({
                    type: 'game',
                    text: game.title,
                    element: game.element
                });
            }
        });
        
        // 添加匹配的关键词
        keywordsList.forEach(keyword => {
            if (keyword.toLowerCase().includes(query) && !suggestions.some(s => s.text === keyword)) {
                suggestions.push({
                    type: 'keyword',
                    text: keyword
                });
            }
        });
        
        return suggestions;
    }
    
    // 显示搜索建议
    function showSuggestions(suggestions, query) {
        if (!suggestionsContainer) return;
        
        suggestionsContainer.innerHTML = '';
        
        if (suggestions.length === 0) {
            suggestionsContainer.innerHTML = '<div class="no-suggestions">没有找到相关结果</div>';
        } else {
            suggestions.forEach((suggestion, index) => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.setAttribute('data-index', index);
                
                // 高亮匹配的文本
                const regex = new RegExp(`(${query})`, 'gi');
                const highlightedText = suggestion.text.replace(regex, '<span class="highlight">$1</span>');
                
                item.innerHTML = highlightedText;
                
                // 添加图标区分游戏和关键词
                if (suggestion.type === 'keyword') {
                    item.innerHTML = '🏷️ ' + item.innerHTML;
                } else {
                    item.innerHTML = '🎮 ' + item.innerHTML;
                }
                
                // 点击建议项
                item.addEventListener('click', function() {
                    if (suggestion.type === 'game') {
                        // 滚动到游戏
                        searchInput.value = suggestion.text;
                        scrollToGame(suggestion.element);
                        highlightGame(suggestion.element);
                    } else {
                        // 设置关键词并搜索
                        searchInput.value = suggestion.text;
                        performSearch(suggestion.text);
                        
                        // 激活关键词标签
                        keywordTags.forEach(tag => {
                            if (tag.textContent.trim() === suggestion.text) {
                                tag.click();
                            }
                        });
                    }
                    hideSuggestions();
                });
                
                suggestionsContainer.appendChild(item);
            });
        }
        
        suggestionsContainer.classList.add('active');
    }
    
    // 隐藏搜索建议
    function hideSuggestions() {
        if (!suggestionsContainer) return;
        
        suggestionsContainer.classList.remove('active');
        setTimeout(() => {
            suggestionsContainer.innerHTML = '';
        }, 300);
    }
    
    // 导航建议项
    function navigateSuggestions(direction) {
        if (!suggestionsContainer) return;
        
        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;
        
        // 找到当前选中项
        const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
        let newIndex = currentIndex + direction;
        
        // 边界处理
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
        
        // 取消当前选中
        items.forEach(item => item.classList.remove('selected'));
        
        // 设置新选中项
        items[newIndex].classList.add('selected');
        
        // 将选中项设置到搜索框
        const selectedText = items[newIndex].textContent.trim().replace(/^[🏷️🎮]\s+/, '');
        searchInput.value = selectedText;
    }
    
    // 执行搜索
    function performSearch(query) {
        // 重置所有游戏的显示
        gameTiles.forEach(tile => {
            tile.style.display = '';
            tile.classList.remove('highlight-effect');
        });
        
        // 搜索匹配的游戏
        let hasMatches = false;
        gamesList.forEach(game => {
            if (game.title.toLowerCase().includes(query)) {
                highlightGame(game.element);
                hasMatches = true;
            } else {
                game.element.style.opacity = '0.5';
            }
        });
        
        // 搜索匹配的关键词
        keywordTags.forEach(tag => {
            const keyword = tag.textContent.trim().toLowerCase();
            if (keyword === query.toLowerCase()) {
                tag.click();
                hasMatches = true;
            }
        });
        
        // 如果没有匹配，显示提示
        if (!hasMatches) {
            showNotification('没有找到匹配的游戏或关键词', 'error');
            
            // 重置所有游戏的显示
            gamesList.forEach(game => {
                game.element.style.opacity = '';
            });
        }
    }
    
    // 滚动到游戏
    function scrollToGame(gameElement) {
        gameElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
    
    // 高亮游戏
    function highlightGame(gameElement) {
        gameElement.style.opacity = '';
        gameElement.classList.add('highlight-effect');
        setTimeout(() => {
            gameElement.classList.remove('highlight-effect');
        }, 2000);
    }
} 