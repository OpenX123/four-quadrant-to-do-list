// const { BrowserWindow } = require('@electron/remote');

let desktopWindow = null;
let todos = [];

// 数据持久化
const DB_KEY = 'desktop-todo-data';
const SETTINGS_KEY = 'desktop-todo-settings';

// 默认设置
let settings = {
  theme: 'light',
  bgColor: '#ffffff',
  textColor: '#333333',
  opacity: 1,
  lastTheme: 'light',
  customBgColor: null,
  backgroundImage: null
};

// 主题配置
const themes = {
  light: {
    bgColor: '#ffffff',
    textColor: '#333333',
    quadrantColors: {
      1: { color: '#ff4d4f', bgColor: '#fff1f0' },
      2: { color: '#ffa940', bgColor: '#fff7e6' },
      3: { color: '#4096ff', bgColor: '#e6f4ff' },
      4: { color: '#73d13d', bgColor: '#f6ffed' }
    }
  },
  dark: {
    bgColor: '#1f1f1f',
    textColor: '#ffffff',
    quadrantColors: {
      1: { color: '#ff7875', bgColor: '#2a1215' },
      2: { color: '#ffc069', bgColor: '#2b1d11' },
      3: { color: '#69c0ff', bgColor: '#111d2c' },
      4: { color: '#95de64', bgColor: '#162312' }
    }
  }
};

// 初始化 todoApp 对象
window.todoApp = {
  todos: [],
  settings: {
    lastTheme: 'light',
    customBgColor: null,
    opacity: 1,
    backgroundImage: null
  },

  // 获取所有待办事项
  getTodos() {
    return this.todos;
  },

  // 添加待办事项
  addTodo(content, quadrant) {
    const todo = {
      id: Date.now(),
      content,
      quadrant,
      completed: false,
      description: '', // 富文本描述内容
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.todos.push(todo);
    this.saveTodos();
    return todo;
  },

  // 删除待办事项
  deleteTodo(id) {
    const index = this.todos.findIndex(todo => todo.id === id);
    if (index !== -1) {
      this.todos.splice(index, 1);
      this.saveTodos();
      return true;
    }
    return false;
  },

  // 更新待办事项
  updateTodo(id, updates) {
    try {
      const index = this.todos.findIndex(todo => todo.id === id);
      
      if (index === -1) return false;
      
      // 保留原有的其他属性，只更新传入的字段
      this.todos[index] = {
        ...this.todos[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // 保存更新后的数组
      this.saveTodos();
      return true;
    } catch (error) {
      console.error('更新待办事项时出错:', error);
      return false;
    }
  },

  // 切换待办事项状态
  toggleTodo(id) {
    const todo = this.todos.find(todo => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      if (todo.completed) {
        todo.completedAt = new Date().toISOString();
      } else {
        delete todo.completedAt;
      }
      this.saveTodos();
      return true;
    }
    return false;
  },

  // 清除所有已完成的任务
  clearCompletedTasks() {
    this.todos = this.todos.filter(todo => !todo.completed);
    this.saveTodos();
  },

  // 保存待办事项到本地存储
  saveTodos() {
    try {
      utools.dbStorage.setItem(DB_KEY, JSON.stringify(this.todos));
    } catch (error) {
      console.error('保存待办事项失败:', error);
    }
  },

  // 从本地存储加载待办事项
  loadTodos() {
    try {
      const savedTodos = utools.dbStorage.getItem(DB_KEY);
      if (savedTodos) {
        this.todos = JSON.parse(savedTodos);
      }
    } catch (error) {
      console.error('加载待办事项失败:', error);
    }
  },

  // 获取主题
  getThemes() {
    return themes;
  },

  // 设置主题
  setTheme(themeName) {
    if (themes[themeName]) {
      this.settings.lastTheme = themeName;
      this.saveSettings();
      return true;
    }
    return false;
  },

  // 获取设置
  getSettings() {
    return this.settings;
  },

  // 更新设置
  updateSettings(updates) {
    Object.assign(this.settings, updates);
    this.saveSettings();
  },

  // 保存设置到本地存储
  saveSettings() {
    try {
      utools.dbStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },

  // 从本地存储加载设置
  loadSettings() {
    try {
      const savedSettings = utools.dbStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        this.settings = {...this.settings, ...JSON.parse(savedSettings)};
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },

  // 添加更新任务描述的方法
  updateTodoDescription(id, description) {
    const todo = this.todos.find(todo => todo.id === id);
    if (todo) {
      todo.description = description;
      todo.updatedAt = new Date().toISOString();
      this.saveTodos();
      return true;
    }
    return false;
  },

  // 初始化
  init() {
    this.loadTodos();
    this.loadSettings();
  }
};

// 初始化应用
window.todoApp.init();

// 监听特定的 feature
window.exports = {
  'desktop-todo': {
    mode: 'none',
    args: {
      enter: () => {
        window.todoApp.init(); // 进入插件时重新加载数据
        utools.showMainWindow();
      }
    }
  },
  'todo-detail': {
    mode: 'none',
    args: {
      enter: (action) => {
        try {
          // 解析传入的数据
          const data = JSON.parse(action.payload);
          if (data?.id) {
            window.location.href = `todo-detail.html?id=${data.id}`;
          }
        } catch (error) {
          console.error('解析数据失败:', error);
          window.location.href = 'index.html';
        }
      }
    }
  }
};