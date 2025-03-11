// src/types/antd.d.ts or any .d.ts file in your project

declare module "antd" {
  // Import all major components from antd
  import {
    Affix,
    Alert,
    Anchor,
    AutoComplete,
    Avatar,
    BackTop,
    Badge,
    Breadcrumb,
    Button,
    Calendar,
    Card,
    Carousel,
    Cascader,
    Checkbox,
    Col,
    Collapse,
    Comment,
    ConfigProvider,
    DatePicker,
    Descriptions,
    Divider,
    Drawer,
    Dropdown,
    Empty,
    Form,
    GetProps,
    Grid,
    Image,
    Input,
    InputNumber,
    Layout,
    List,
    Mentions,
    Menu,
    message,
    Modal,
    notification,
    Pagination,
    Popconfirm,
    Popover,
    Progress,
    Radio,
    Rate,
    Result,
    Row,
    Select,
    Skeleton,
    Slider,
    Space,
    Spin,
    Statistic,
    Steps,
    Switch,
    Table,
    Tabs,
    TabsProps,
    Tag,
    Typography,
    TimePicker,
    Timeline,
    Tooltip,
    Transfer,
    Tree,
    TreeSelect,
    Typography,
    Upload,
    QRCode,
  } from "antd";

  // Export all components
  export const QRCode: React.FC<QRCodeProps>;
  export const Affix: typeof Affix;
  export const Alert: typeof Alert;
  export const Anchor: typeof Anchor;
  export const AutoComplete: typeof AutoComplete;
  export const Avatar: typeof Avatar;
  export const BackTop: typeof BackTop;
  export const Badge: typeof Badge;
  export const Breadcrumb: typeof Breadcrumb;
  export const Button: typeof Button;
  export const Calendar: typeof Calendar;
  export const Card: typeof Card;
  export const Carousel: typeof Carousel;
  export const Cascader: typeof Cascader;
  export const Checkbox: typeof Checkbox;
  export const Col: typeof Col;
  export const Collapse: typeof Collapse;
  export const Comment: typeof Comment;
  export const ConfigProvider: typeof ConfigProvider;
  export const DatePicker: typeof DatePicker;
  export const Descriptions: typeof Descriptions;
  export const Divider: typeof Divider;
  export const Drawer: typeof Drawer;
  export const Dropdown: typeof Dropdown;
  export const Empty: typeof Empty;
  export const Form: typeof Form;
  export const GetProps: typeof GetProps;
  export const Grid: typeof Grid;
  export const Image: typeof Image;
  export const Input: typeof Input;
  export const InputNumber: typeof InputNumber;
  export const Layout: typeof Layout;
  export const List: typeof List;
  export const Mentions: typeof Mentions;
  export const Menu: typeof Menu;
  export const message: typeof message;
  export const Modal: typeof Modal;
  export const notification: typeof notification;
  export const Pagination: typeof Pagination;
  export const Popconfirm: typeof Popconfirm;
  export const Popover: typeof Popover;
  export const Progress: typeof Progress;
  export const Radio: typeof Radio;
  export const Rate: typeof Rate;
  export const Result: typeof Result;
  export const Row: typeof Row;
  export const Select: typeof Select;
  export const Skeleton: typeof Skeleton;
  export const Slider: typeof Slider;
  export const Space: typeof Space;
  export const Spin: typeof Spin;
  export const Statistic: typeof Statistic;
  export const Steps: typeof Steps;
  export const Switch: typeof Switch;
  export const Table: typeof Table;
  export const Tabs: typeof Tabs;
  export const TabsProps: typeof TabsProps;
  export const Tag: typeof Tag;
  export const Typography: typeof Typography;
  export const TimePicker: typeof TimePicker;
  export const Timeline: typeof Timeline;
  export const Tooltip: typeof Tooltip;
  export const Transfer: typeof Transfer;
  export const Tree: typeof Tree;
  export const TreeSelect: typeof TreeSelect;
  export const Typography: typeof Typography;
  export const Upload: typeof Upload;

  // Specific Types (e.g., for Input, Modal, etc.)
  export interface InputRef {
    focus: () => void;
    blur: () => void;
    input: HTMLInputElement | HTMLTextAreaElement;
  }
  export interface QRCodeProps {
    value: string;
    size?: number;
    level?: "L" | "M" | "Q" | "H";
    bgColor?: string;
    fgColor?: string;
    includeMargin?: boolean;
    // Add other props as needed based on the library's documentation
  }

  export interface ModalFuncProps {
    content?: React.ReactNode;
    title?: React.ReactNode;
    onOk?: () => void;
    onCancel?: () => void;
    width?: number | string;
    // Add other props as needed based on Modal documentation
  }

  // Add other custom types or interfaces as needed for specific components
  export interface ButtonProps {
    type?: "primary" | "default" | "dashed" | "link" | "text";
    onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    // Add other props based on Button documentation
  }

  // You can continue adding interfaces for other components like Form, Select, etc.,
  // based on their props in the Ant Design documentation
}


