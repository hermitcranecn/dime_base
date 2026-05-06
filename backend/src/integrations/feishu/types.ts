/**
 * dime_base - Feishu Integration Types
 * 
 * Type definitions for Feishu bot integration
 */

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  verificationToken: string;
  encryptKey?: string;
}

export interface FeishuUser {
  openId: string;
  unionId?: string;
  name: string;
  avatar?: string;
}

export interface FeishuMessage {
  msg_id: string;
  root_id?: string;
  sender: {
    sender_id: {
      open_id: string;
      user_id?: string;
    };
  };
  chat_id?: string;
  message_type: 'text' | 'post' | 'image' | 'file';
  body: {
    content: string;
  };
  create_time: string;
}

export interface FeishuEvent {
  type: string;
  challenge?: string;
  event?: {
    message?: FeishuMessage;
    chat_id?: string;
    operator?: {
      operator_id: {
        open_id: string;
      };
    };
  };
}

export interface FeishuCommand {
  command: string;
  args: string[];
}

export interface OwnerLink {
  ownerId: string;
  feishuOpenId: string;
  createdAt: Date;
}

// Command patterns
export const COMMANDS = {
  CREATE: 'create',
  PAUSE: 'pause',
  RESUME: 'resume',
  STATUS: 'status',
  CONFIG: 'config',
  HELP: 'help'
} as const;

export type CommandName = typeof COMMANDS[keyof typeof COMMANDS];

// Response templates
export const WELCOME_MESSAGE = `💰 欢迎使用 dime_base！

我是你的数字分身份助手。

命令：
/create - 创建数字分身份
/pause - 暂停服务
/resume - 恢复服务
/status - 查看状态
/help - 帮助

直接发送消息开始对话~`;

export const HELP_MESSAGE = `💰 命令列表：

/create - 创建你的数字分身份
/pause - 暂停服务
/resume - 恢复服务
/status - 查看分身份状态
/config - 配置分身份
/help - 显示此帮助

直接发送消息与我对话~`;

export const PAUSED_MESSAGE = `⏸️ 服务已暂停。发送 /resume 恢复。`;

export const ALREADY_ACTIVE_MESSAGE = `✅ 分身份已经在服务中~`;

export const NOT_FOUND_MESSAGE = `❌ 你还没有分身份。发送 /create 创建。`;

export const CREATED_MESSAGE = (name: string) => `✅ 创建成功！你的数字分身份 "${name}" 已上线~

直接发送消息开始对话！`;