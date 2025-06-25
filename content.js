// 创建并插入悬浮窗口
function createFloatingWindow() {
  const floatingDiv = document.createElement('div');
  floatingDiv.className = 'auto-clicker-floating-window';
  floatingDiv.innerHTML = `
    <div class="container">
      <div class="drag-handle">
        <div class="window-controls">
          <span class="control close"></span>
          <span class="control minimize"></span>
          <span class="control maximize"></span>
        </div>
        <span class="title">自动点击助手</span>
        <span class="spacer"></span>
      </div>
      <div class="content">
        <div class="status-container">
          <span>状态</span>
          <span id="auto-clicker-status" class="status-badge">未运行</span>
        </div>
        <button id="auto-clicker-toggle">开启自动点击</button>
        <div class="info">
          <svg class="info-icon" viewBox="0 0 24 24" width="12" height="12">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span>每10秒自动检测并点击按钮</span>
        </div>
        <div class="log-container">
          <div id="log-content"></div>
        </div>
        <div class="author">by 蒋小渡</div>
      </div>
    </div>
  `;
  document.body.appendChild(floatingDiv);

  // 添加拖动功能
  const dragHandle = floatingDiv.querySelector('.drag-handle');
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  dragHandle.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    if (e.target.classList.contains('control')) return;
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === dragHandle || e.target.classList.contains('title')) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      setTranslate(currentX, currentY, floatingDiv);
    }
  }

  function dragEnd() {
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  // 最小化功能
  const minimizeBtn = floatingDiv.querySelector('.control.minimize');
  const content = floatingDiv.querySelector('.content');
  let isMinimized = false;

  minimizeBtn.addEventListener('click', () => {
    content.style.display = isMinimized ? 'block' : 'none';
    floatingDiv.classList.toggle('minimized');
    isMinimized = !isMinimized;
  });

  // 关闭功能
  const closeBtn = floatingDiv.querySelector('.control.close');
  closeBtn.addEventListener('click', () => {
    floatingDiv.style.display = 'none';
  });

  // 添加自动点击功能
  const toggleButton = floatingDiv.querySelector('#auto-clicker-toggle');
  const statusElement = floatingDiv.querySelector('#auto-clicker-status');
  let isRunning = false;

  toggleButton.addEventListener('click', () => {
    if (!isRunning) {
      startAutoClick();
      toggleButton.textContent = '停止自动点击';
      toggleButton.classList.add('stop');
      statusElement.textContent = '运行中';
      statusElement.classList.add('running');
      isRunning = true;
    } else {
      stopAutoClick();
      toggleButton.textContent = '开启自动点击';
      toggleButton.classList.remove('stop');
      statusElement.textContent = '已停止';
      statusElement.classList.remove('running');
      isRunning = false;
    }
  });

  // 默认开启自动点击
  startAutoClick();
  toggleButton.textContent = '停止自动点击';
  toggleButton.classList.add('stop');
  statusElement.textContent = '运行中';
  statusElement.classList.add('running');
  isRunning = true;
}

// 添加日志功能
function log(message) {
  const logContent = document.querySelector('#log-content');
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';

  const time = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  logEntry.innerHTML = `<span class="log-time">${time}</span> ${message}`;

  logContent.appendChild(logEntry);

  // 保持最多显示3条日志
  const entries = logContent.getElementsByClassName('log-entry');
  while (entries.length > 3) {
    logContent.removeChild(entries[0]);
  }
}

// 添加主页面自动化处理函数
function handleMainPage() {
  // 检查是否在主页面
  if (!window.location.href.includes('portal/person')) {
    log('不在主页面，跳转中...');
    window.location.href = 'https://www.ejxjy.com/a/sys/portal/person';
    return;
  }

  // 获取课程列表容器
  const courseContainer = document.querySelector('#con_a_2');
  if (!courseContainer) {
    log('未找到课程列表容器');
    return;
  }

  // 获取所有带trainid的课程项
  const courseItems = courseContainer.querySelectorAll('li[data-trainid]');
  log(`找到 ${courseItems.length} 个课程`);

  let foundUnfinished = false;

  // 遍历课程项
  for (const item of courseItems) {
    // 获取课程名称
    const courseName =
      item.querySelector('.courseName')?.textContent || '未知课程';

    // 获取进度元素
    const progressElement = item.querySelector('.learPercent');
    if (!progressElement) {
      log(`课程"${courseName}"无法获取进度`);
      continue;
    }

    // 解析进度百分比
    const progressText = progressElement.textContent.replace('%', '').trim();
    const progress = parseInt(progressText, 10);

    if (isNaN(progress)) {
      log(`课程"${courseName}"进度解析失败`);
      continue;
    }

    log(`课程"${courseName}"进度: ${progress}%`);

    if (progress < 100) {
      foundUnfinished = true;
      // 找到"继续学习"按钮
      const studyButton = item.querySelector('.btn.btn-danger');

      if (studyButton) {
        log(`开始学习课程: "${courseName}"`);

        try {
          // 获取课程链接
          const href = studyButton.getAttribute('href');
          if (!href) {
            log('未找到课程链接');
            continue;
          }

          log(`获取到课程链接: ${href}`);

          // 从javascript:openNewPageDetect('...')中提取实际URL
          const urlMatch = href.match(/openNewPageDetect\('([^']+)'\)/);
          if (urlMatch) {
            const relativePath = urlMatch[1];
            // 解析URL参数
            const courseIdMatch = relativePath.match(/courseId=([^&]+)/);
            const createDateMatch = relativePath.match(/createDate=([^&]+)/);

            if (courseIdMatch && createDateMatch) {
              const courseId = courseIdMatch[1];
              const createDate = createDateMatch[1];

              // 构建完整的URL
              const fullUrl = `https://www.ejxjy.com/a/sys/portal/myCourseDetail.html?courseId=${courseId}&createDate=${createDate}`;
              log(`构建完整URL: ${fullUrl}`);

              // 尝试导航
              try {
                window.location.href = fullUrl;
              } catch (error) {
                log('直接导航失败，尝试替代方案');
                // 如果直接导航失败，尝试创建一个a标签并触发点击
                const link = document.createElement('a');
                link.href = fullUrl;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
              return;
            }
          }

          // 如果URL解析失败，尝试直接点击按钮
          log('无法解析课程参数，尝试直接点击按钮');
          studyButton.click();
          return;
        } catch (error) {
          log(`处理课程"${courseName}"时发生错误`);
          continue;
        }
      } else {
        log(`课程"${courseName}"未找到继续学习按钮`);
      }
    }
  }

  if (!foundUnfinished) {
    log('所有课程已完成！');
    stopAutoClick();
  } else {
    log('未找到可以继续学习的课程');
  }
}

// 修改开始自动点击函数
function startAutoClick() {
  if (!window.autoClickInterval) {
    // 根据URL自动判断模式
    const isMainPage = window.location.href.includes('/sys/portal/person');

    window.autoClickInterval = setInterval(function () {
      // 根据当前页面URL执行相应的处理逻辑
      if (isMainPage) {
        handleMainPage();
      } else {
        // 课程页面逻辑
        const dialogText = document.body.innerText;

        // 5.1 章节完成弹窗处理
        if (dialogText.includes('恭喜您完成本小节课程学习！')) {
          const nextButton = document.querySelector('.jbox-button[value="ok"]');
          if (nextButton) {
            log('找到下一节按钮，执行点击');
            nextButton.click();
          } else {
            log('未找到下一节按钮');
          }
        }
        // 5.2 课程完成弹窗处理
        else if (dialogText.includes('恭喜您已学习完该课程')) {
          const confirmButton = document.querySelector(
            '.jbox-button[value="ok"]'
          );
          if (confirmButton) {
            log('课程已完成，点击确定按钮');
            confirmButton.click();

            // 等待弹窗关闭后跳转到主页
            setTimeout(() => {
              log('即将返回主页面...');
              window.location.href =
                'https://www.ejxjy.com/a/sys/portal/person';
            }, 1000);
          } else {
            log('未找到确定按钮');
          }
        } else {
          log('未找到完成提示');
        }
      }
    }, 10000);
    log(`自动点击已启动 - ${isMainPage ? '主页面模式' : '课程页面模式'}`);
  }
}

function stopAutoClick() {
  if (window.autoClickInterval) {
    clearInterval(window.autoClickInterval);
    window.autoClickInterval = null;
    log('自动点击已停止');
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
  .auto-clicker-floating-window {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1),
                0 0 1px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
    user-select: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .auto-clicker-floating-window.minimized {
    height: 32px;
    overflow: hidden;
  }

  .auto-clicker-floating-window .container {
    width: 240px;
    overflow: hidden;
  }

  .auto-clicker-floating-window .drag-handle {
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .window-controls {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .control {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control.close {
    background-color: #ff5f57;
  }

  .control.minimize {
    background-color: #febc2e;
  }

  .control.maximize {
    background-color: #28c840;
  }

  .control:hover {
    filter: brightness(0.9);
  }

  .title {
    font-size: 12px;
    color: #1c1c1e;
    margin-left: 4px;
    font-weight: 500;
  }

  .spacer {
    flex-grow: 1;
  }

  .auto-clicker-floating-window .content {
    padding: 12px;
  }

  .status-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 12px;
    color: #1c1c1e;
  }

  .status-badge {
    background: rgba(0, 0, 0, 0.05);
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    color: #1c1c1e;
  }

  .status-badge.running {
    background: rgba(52, 199, 89, 0.1);
    color: #34c759;
  }

  button {
    background: #007aff;
    color: white;
    padding: 8px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    width: 100%;
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  button:hover {
    transform: translateY(-1px);
    background: #0071eb;
    box-shadow: 0 4px 8px rgba(0, 122, 255, 0.1);
  }

  button:active {
    transform: translateY(0);
  }

  button.stop {
    background: #ff3b30;
  }

  button.stop:hover {
    background: #ff2d55;
  }

  .info {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #8e8e93;
    font-size: 11px;
    line-height: 1.3;
    padding: 8px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 6px;
  }

  .info-icon {
    flex-shrink: 0;
    opacity: 0.7;
    width: 10px;
    height: 10px;
  }

  .author {
    font-size: 10px;
    color: #8e8e93;
    text-align: right;
    padding-top: 8px;
    opacity: 0.7;
    font-style: italic;
  }

  .log-container {
    margin-top: 12px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 6px;
    padding: 8px;
    max-height: 80px;
    overflow-y: auto;
  }

  .log-entry {
    font-size: 11px;
    color: #666;
    margin-bottom: 4px;
    line-height: 1.4;
    display: flex;
    gap: 6px;
  }

  .log-entry:last-child {
    margin-bottom: 0;
  }

  .log-time {
    color: #999;
    font-family: monospace;
  }

  /* 自定义滚动条样式 */
  .log-container::-webkit-scrollbar {
    width: 4px;
  }

  .log-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .log-container::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }

  .log-container::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`;

document.head.appendChild(style);

// 创建悬浮窗口
createFloatingWindow();
