// ==UserScript==
// @name         Mobile Magnet Link Collector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Mobile-friendly magnet link collector
// @author       Your name
// @match        *://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 添加移动端优化的样式
    GM_addStyle(`
        #magnetButton {
            position: fixed;
            right: 10px;
            bottom: 20px;
            width: 60px;
            height: 60px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 50%;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            text-align: center;
            line-height: 1.2;
            padding: 5px;
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
        }

        #magnetButton:active {
            background: #45a049;
        }

        .magnet-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            overscroll-behavior: contain;
        }

        .modal-content {
            position: relative;
            background: white;
            margin: 15px;
            padding: 15px;
            border-radius: 10px;
            max-height: 90vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        .modal-close {
            position: absolute;
            right: 15px;
            top: 15px;
            width: 30px;
            height: 30px;
            line-height: 30px;
            text-align: center;
            font-size: 24px;
            cursor: pointer;
            z-index: 1;
        }

        .magnet-links {
            width: 100%;
            height: 200px;
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 8px;
            resize: none;
            font-size: 14px;
            line-height: 1.4;
            -webkit-appearance: none;
        }

        .modal-buttons {
            display: flex;
            justify-content: space-around;
            margin-top: 15px;
            gap: 10px;
        }

        .modal-button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
        }

        .copy-button {
            background: #4CAF50;
            color: white;
        }

        .clear-button {
            background: #f44336;
            color: white;
        }

        .notification {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-size: 14px;
            text-align: center;
            max-width: 90%;
        }
    `);

    // 初始化变量
    let links = JSON.parse(localStorage.getItem('magnetLinks') || '[]');
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    let xOffset = 0;
    let yOffset = 0;

    // 创建浮动按钮
    const button = document.createElement('div');
    button.id = 'magnetButton';
    updateButtonText();
    document.body.appendChild(button);

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'magnet-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h2 style="margin-top: 10px; font-size: 18px;">磁力链接列表</h2>
            <textarea class="magnet-links" readonly></textarea>
            <div class="modal-buttons">
                <button class="modal-button copy-button">复制全部</button>
                <button class="modal-button clear-button">清除全部</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 更新按钮文本
    function updateButtonText() {
        button.textContent = `已收集${links.length}个链接`;
    }

    // 保存链接到localStorage
    function saveLinks() {
        localStorage.setItem('magnetLinks', JSON.stringify(links));
        updateButtonText();
    }

    // 处理触摸事件
    button.addEventListener('touchstart', dragStart, false);
    document.addEventListener('touchmove', drag, false);
    document.addEventListener('touchend', dragEnd, false);

    function dragStart(e) {
        if (e.target === button) {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            const currentX = e.touches[0].clientX - initialX;
            const currentY = e.touches[0].clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            const maxX = window.innerWidth - button.offsetWidth;
            const maxY = window.innerHeight - button.offsetHeight;

            const newX = Math.min(Math.max(0, currentX), maxX);
            const newY = Math.min(Math.max(0, currentY), maxY);

            setTranslate(newX, newY, button);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    // 监听复制事件
    document.addEventListener('copy', function(e) {
        setTimeout(() => {
            const copiedText = window.getSelection().toString().trim();
            if (copiedText.startsWith('magnet:?xt=urn:btih:')) {
                if (!links.includes(copiedText)) {
                    links.push(copiedText);
                    saveLinks();
                    showNotification('已添加新的磁力链接！');
                }
            }
        }, 100);
    });

    // 显示模态框
    button.addEventListener('click', function(e) {
        if (!isDragging) {
            modal.style.display = 'block';
            const textarea = modal.querySelector('.magnet-links');
            textarea.value = links.join('\n');
        }
    });

    // 关闭模态框
    modal.querySelector('.modal-close').addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // 复制全部按钮
    modal.querySelector('.copy-button').addEventListener('click', function() {
        const textarea = modal.querySelector('.magnet-links');
        textarea.select();
        document.execCommand('copy');
        showNotification('已复制全部链接！');
    });

    // 清除全部按钮
    modal.querySelector('.clear-button').addEventListener('click', function() {
        if (confirm('确定要清除所有链接吗？')) {
            links = [];
            saveLinks();
            modal.querySelector('.magnet-links').value = '';
            showNotification('已清除所有链接！');
            modal.style.display = 'none';
        }
    });

    // 显示通知
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    // 防止滚动穿透
    modal.addEventListener('touchmove', function(e) {
        if (!e.target.classList.contains('magnet-links')) {
            e.preventDefault();
        }
    }, { passive: false });
})();