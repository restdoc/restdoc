
生成更详细的清单

更详细对照清单（Hoppscotch → 本项目现状 → 缺口 → 具体实现拆解/验收）
标记说明

现状：✅已实现 / 🟡部分实现（UI有但逻辑缺）/ ❌缺失
落点：优先指向你现有结构：src/app/main/apilist/、src/app/shared/shared.service.ts、src/app/main/settings/、src/app/dialog/
验收：给 agent 明确“做到什么算完成”
A. 基础 REST Client（Hoppscotch 的核心）
A1. 内置发送器（不依赖扩展）
现状：🟡 Send() 依赖 __RESTDOC_EXTENSION_REQUEST__ postMessage
缺口：无扩展时不能请求；没有统一网络层（重试/超时/abort）
实现拆解
新增 RestClientService（建议放 src/app/main/ 或 src/app/shared/）
输入：APIElement + EndpointElement + 渲染后的参数
输出：ResponseElement（statusCode/statusText/headers/body/responseTime/size/responseUrl/contentType）
用 公开 API：fetch + AbortController（推荐，能拿到 headers/状态码更自然）
timeout：到时 controller.abort()
followRedirects：浏览器 fetch 只能 redirect: "follow" | "manual" | "error"，UI 要提示限制（同源/opaque）
APIlistComponent.Send() 改为：
若用户设置“使用扩展”且扩展可用 → 走扩展
否则 → 走 RestClientService.send()
验收
关闭/不安装扩展时：GET/POST 仍可发出并展示 Response/Headers
timeout 生效：超时会进入 error response 且 UI 不崩
A2. 请求构建完整性（Query/Headers/Body/Auth）
现状：🟡 Params/Headers/Auth/Body 基本拼装已做，但缺细节
缺口
headers enabled/disabled 与最终请求一致性
raw body content-type 对齐
form-data 文件上传缺失（binary tab 还写着未实现）
实现拆解
Query：只拼 enabled=true 的 param；空 key 跳过；重复 key 支持（数组）
Headers：去重策略（例如按 key 最后一个覆盖或保留多值，需明确）
Body
x-www-form-urlencoded：用 URLSearchParams
form-data：用 FormData（并支持 file 类型行：type=text|file）
raw：string；支持 JSON/XML/Text 三种格式选择时自动设置 Content-Type
binary：用 <input type="file"> 选文件，支持 PUT/POST 发送 Blob/ArrayBuffer
Auth
Basic/Bearer 已有 → 做成“发送时注入 header”，同时避免重复添加多条 Authorization
验收
Postman 常见场景：同样参数/headers/body 发出请求能得到相同结果
binary：选择文件后可成功上传（服务端回显或返回 200）
A3. Cookie / Session（浏览器限制下的最小实现）
现状：❌
缺口：Hoppscotch 有 cookie 管理/withCredentials；你目前请求若跨域会很受限
实现拆解
fetch：支持 credentials: "include"（提供 UI 开关）
说明：跨域 cookie 是否能带取决于服务端 CORS
可选：做 “Cookie Jar” 仅用于展示与编辑（真正注入 cookie header 浏览器限制，需提示）
验收
同源接口：登录后带 cookie 的请求能成功
UI 能显示“本次请求是否带 credentials”
B. 环境变量 / 模板（Hoppscotch 的生产力核心）
B1. 环境变量管理（Global + Project）
现状：❌（未见变量存储/页面）
缺口：无 env，无法 {{token}}
实现拆解
数据模型：EnvVar { key, value, enabled, secret }
存储：先 localStorage（公开 API），key 带 projectId
UI：新增 Settings 子页（src/app/main/settings/）
列表 CRUD、搜索、secret mask、导入导出 JSON
验收
添加变量后，刷新页面仍存在
secret 默认遮罩，可切换显示
B2. 模板渲染引擎（{{var}}）
现状：❌
缺口：URL/Headers/Body 不能替换变量
实现拆解
实现 renderTemplateString(str, ctx) 支持 {{key}}，未定义给出标记
对象渲染：对 request 的 path/params/headers/raw/form_data/auth 全面渲染
支持转义：\{{notvar}}
验收
{{baseUrl}}/users?token={{token}} 能正确替换
未定义变量会在发送前提示“缺少变量：token”
B3. 动态变量（时间戳/uuid）
现状：❌
实现拆解
内置变量：{{$timestamp}}、{{$uuid}}、{{$randomInt}}
验收
每次发送会生成不同 uuid
C. Scripts：Pre-request / Tests（Hoppscotch/Postman 风格）
C1. 脚本运行时（安全边界清晰）
现状：🟡 有编辑器字段，但不执行
缺口：无执行、无结果
实现拆解（最小可用）
用公开 API：sandbox iframe（推荐）
iframe 里运行脚本，主页面通过 postMessage 传入上下文与拿回结果
限制：不让脚本访问 DOM/localStorage（iframe 用 sandbox）
提供 API：
setEnv/getEnv
setHeader(name, value)
setParam(name, value)
log() 收集日志
流程：
pre-request → 修改 request → 发送 → tests（拿 response）
验收
pre-request 能设置 header，网络层确实带上
tests 能断言 status=200 并显示通过/失败
C2. 断言与报告 UI
现状：❌
实现拆解
test tab 增加：结果列表、console logs、耗时
验收
失败断言会显示 message + 位置（至少行号/stack）
D. History / Collections / 导入导出
D1. History（请求历史）
现状：❌
实现拆解
存储：localStorage（按 projectId 分桶）
记录字段：method/url/headers/body 摘要 + status/time + timestamp
UI：新增侧栏入口或 settings 页入口
功能：搜索、点击恢复、删除、清空
验收
能从历史一键恢复并再次发送
D2. Collections（集合视图）
现状：🟡 你已有 Project/Group/API 的集合概念，但缺“导入导出标准化/分享”
实现拆解
导出本项目 JSON（版本化 schema）
导入：创建 project + groups + apis（调用 SharedService 的公开接口）
验收
导出→导入后结构与请求内容一致
D3. OpenAPI 导入
现状：❌
实现拆解
上传文件（已有 upload-file 对话框可复用）
解析 openapi v3 → tags/groups → paths+methods/apis
映射：params/header/requestBody/示例
验收
导入 petstore 后能生成可发送的请求
D4. Postman collection 导入
现状：❌
实现拆解
解析 v2.1 JSON，递归 folders → groups
映射：auth/headers/query/body/raw/formdata
验收
一个真实 collection 导入后能成功发送其中大多数请求
E. 代码生成 / 分享
E1. Codegen（curl/fetch/axios）
现状：❌
实现拆解
从渲染后的 request 生成字符串
UI：request bar “更多菜单”
验收
生成的 curl 可直接跑通
E2. Share / Copy as link
现状：🟡 代码里有 copyLink/openInNewTab 占位
实现拆解
生成可分享链接：把 request 编码进 URL（短期）或存后端返回 shareId（长期）
验收
复制链接在新窗口打开能恢复请求
F. 协议扩展（Hoppscotch 的多工具箱）
F1. GraphQL
现状：❌
实现拆解
新路由 /graphql
query/variables/headers/auth + JSON response viewer
验收
能对任意 GraphQL endpoint 执行 query 并显示结果
F2. WebSocket
现状：❌
实现拆解
新路由 /ws
连接/断开/重连、消息时间线
验收
echo server 收发消息正常
F3. SSE
现状：❌
实现拆解
EventSource（公开 API），订阅并展示事件流
验收
能持续收到事件并可停止
G. 体验与工程化（对齐 Hoppscotch 的“顺手”）
G1. Tab/Workspace 行为
现状：✅ 有 requests[] tab，但缺“保存、固定、重命名、复制”
缺口：tab 状态刷新丢失、无 pin
实现拆解
把打开的 tabs 存 localStorage；支持 pin/close others
验收
刷新后 tabs 仍存在
G2. 快捷键与命令面板
现状：🟡 有 hotkeys 模块
实现拆解
Send/Focus URL/切换 tabs/搜索 history
验收
常用快捷键可用且不冲突
给 agent 的“超详细任务提示词模板”（你复制后改括号内容即可）

目标：实现（功能名），对齐 Hoppscotch 的（模块名）。
现状文件：
- src/app/main/apilist/apilist.component.ts（Send/请求组装/响应展示）
- src/app/shared/shared.service.ts（后端 CRUD）
- src/app/main/settings/（新增设置页放这里）
需求：
- 功能点：
  1) ...
  2) ...
- 约束：只能使用公开 API（Angular/浏览器标准 API/现有后端接口），不使用私有或容易被审核拒绝的方法。
- UI 位置：...
- 数据结构：新增/修改 interface：...
实现步骤：
- Step 1: 新增 service ...
- Step 2: 改造 Send() ...
- Step 3: UI 增加 ...
- Step 4: 本地存储/后端存储 ...
验收标准：
- 用例 1：...
- 用例 2：...
- 回归：不影响现有扩展发送流程（作为可选项仍可用）