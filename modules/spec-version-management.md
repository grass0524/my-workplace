# Spec 版本管理模块

本模块提供Spec版本管理的标准流程和工具函数，供其他命令调用。

## 版本管理流程

### 1. 初始化版本管理（创建初始版本）

**使用场景**：`/编写规格` 命令创建新Spec时

**执行步骤**：

1. **创建版本目录**：
   ```bash
   mkdir -p $FEATURE_DIR/versions
   ```

2. **创建VERSION文件**：
   ```bash
   echo "v1.0.0" > $FEATURE_DIR/VERSION
   ```

3. **创建CHANGELOG.md**：
   - 从模板 `docs/specs/CHANGELOG.template.md` 复制
   - 填写初始版本信息：
     - 版本号：v1.0.0
     - 变更类型：✨ 初始版本
     - 变更原因：说明创建原因（如：基于竞品分析生成、基于用户需求描述生成等）
     - 变更内容：列出初始内容
     - 影响范围：说明初始版本的影响
     - 验证状态：✅ 已通过[验证方式]

4. **更新spec.md头部**：
   - 添加版本信息字段：
     - `**当前版本**：v1.0.0`
     - `**版本历史**：查看 [CHANGELOG.md](./CHANGELOG.md)`
   - 添加版本信息章节：
     ```markdown
     ## 版本信息
     - **v1.0.0** (YYYY-MM-DD) - 初始版本，[创建原因说明]
     ```

---

### 2. 创建新版本（更新Spec时）

**使用场景**：
- `/澄清需求` 更新Spec时
- `/原型验证` 用户选择更新Spec时
- `/设计验证` 用户选择更新Spec时
- `/更新Spec` 执行更新时

**参数**：
- `$FEATURE_DIR`：功能目录路径
- `$FEATURE_SPEC`：Spec文件路径
- `$VERSION_TYPE`：版本类型（patch/minor/major）
- `$CHANGE_TYPE`：变更类型标识（🔍/🖼️/🎨/🔄/🚀）
- `$CHANGE_REASON`：变更原因描述
- `$CHANGE_CONTENT`：变更内容列表
- `$IMPACT_SCOPE`：影响范围描述
- `$VERIFICATION_STATUS`：验证状态

**执行步骤**：

1. **读取当前版本号**：
   ```bash
   CURRENT_VERSION=$(cat $FEATURE_DIR/VERSION 2>/dev/null || echo "v1.0.0")
   ```

2. **计算新版本号**：
   - 解析当前版本号：`MAJOR.MINOR.PATCH`
   - 根据 `$VERSION_TYPE` 递增：
     - `patch`：PATCH + 1（如：v1.0.0 → v1.0.1）
     - `minor`：MINOR + 1, PATCH = 0（如：v1.0.1 → v1.1.0）
     - `major`：MAJOR + 1, MINOR = 0, PATCH = 0（如：v1.3.0 → v2.0.0）

3. **保存旧版本**：
   ```bash
   cp $FEATURE_SPEC $FEATURE_DIR/versions/${CURRENT_VERSION}-spec.md
   ```

4. **更新VERSION文件**：
   ```bash
   echo "$NEW_VERSION" > $FEATURE_DIR/VERSION
   ```

5. **更新spec.md头部**：
   - 更新 `**当前版本**` 字段为新版本号
   - 更新 `**最后更新**` 字段为当前日期
   - 在版本信息章节中添加新版本记录

6. **更新CHANGELOG.md**：
   - 在文件开头（`---` 之后）添加新版本记录：
     ```markdown
     ## [vX.X.X] - YYYY-MM-DD
     
     ### 变更类型
     $CHANGE_TYPE $CHANGE_TYPE_NAME
     
     ### 变更原因
     $CHANGE_REASON
     
     ### 变更内容
     $CHANGE_CONTENT
     
     ### 影响范围
     $IMPACT_SCOPE
     
     ### 验证状态
     $VERIFICATION_STATUS
     
     ---
     ```

---

### 3. 版本管理函数（供命令调用）

#### 3.1 初始化版本管理

**函数名**：`init_version_management`

**参数**：
- `$FEATURE_DIR`：功能目录路径
- `$FEATURE_SPEC`：Spec文件路径
- `$CREATION_REASON`：创建原因（可选）

**返回值**：版本号（如：v1.0.0）

**使用示例**：
```bash
# 在 /编写规格 命令中
VERSION=$(init_version_management "$FEATURE_DIR" "$FEATURE_SPEC" "基于竞品分析生成")
```

---

#### 3.2 创建新版本

**函数名**：`create_new_version`

**参数**：
- `$FEATURE_DIR`：功能目录路径
- `$FEATURE_SPEC`：Spec文件路径
- `$VERSION_TYPE`：版本类型（patch/minor/major）
- `$CHANGE_TYPE`：变更类型标识（🔍/🖼️/🎨/🔄/🚀）
- `$CHANGE_TYPE_NAME`：变更类型名称
- `$CHANGE_REASON`：变更原因
- `$CHANGE_CONTENT`：变更内容（Markdown列表格式）
- `$IMPACT_SCOPE`：影响范围（Markdown列表格式）
- `$VERIFICATION_STATUS`：验证状态

**返回值**：新版本号

**使用示例**：
```bash
# 在 /澄清需求 命令中
NEW_VERSION=$(create_new_version \
  "$FEATURE_DIR" \
  "$FEATURE_SPEC" \
  "patch" \
  "🔍" \
  "澄清需求" \
  "澄清需求阶段发现筛选条件的匹配规则描述不够清晰" \
  "- 在\"FR-002\"和\"FR-003\"中明确了模糊匹配使用\"包含关系\"\n- 更新了\"用户故事 2\"的验收场景" \
  "- 后端开发：筛选接口需要实现包含关系的模糊匹配" \
  "✅ 已通过澄清需求验证")
```

---

#### 3.3 获取当前版本号

**函数名**：`get_current_version`

**参数**：
- `$FEATURE_DIR`：功能目录路径

**返回值**：当前版本号（如：v1.0.0），如果不存在则返回 v1.0.0

**使用示例**：
```bash
CURRENT_VERSION=$(get_current_version "$FEATURE_DIR")
```

---

## 变更类型映射

| 命令 | 变更类型标识 | 变更类型名称 | 版本类型 |
|------|------------|------------|---------|
| `/澄清需求` | 🔍 | 澄清需求 | patch |
| `/原型验证` | 🖼️ | 原型验证调整 | minor |
| `/设计验证` | 🎨 | 设计验证调整 | minor |
| `/更新Spec` | 🔄 | 更新Spec | minor |
| `/编写规格` (迭代) | 🚀 | 迭代开发 | major |

---

## 集成到命令中的方式

### 方式1：在命令文件中引用本模块

在命令文件开头添加：

```markdown
## 版本管理

**⚠️ 必须执行**：在继续之前，**必须先加载并完全遵循**模块文件：`.cursor/commands/company/modules/spec-version-management.md`

**加载方式**：使用 `read_file` 工具读取该模块文件，理解完整的执行流程

**执行要求**：严格按照模块中定义的流程执行版本管理操作
```

### 方式2：在命令执行流程中调用

在命令的相应步骤中：

1. **创建Spec时**（`/编写规格`）：
   - 在步骤2（创建新功能并初始化文件）之后
   - 调用 `init_version_management` 函数

2. **更新Spec时**（`/澄清需求`、`/原型验证`、`/设计验证`、`/更新Spec`）：
   - 在更新Spec文件之前
   - 调用 `create_new_version` 函数
   - 然后执行Spec更新操作

---

## 注意事项

1. **版本号格式**：必须使用 `vX.Y.Z` 格式（如：v1.0.0）
2. **版本连续性**：版本号应该连续递增，不要跳过版本号
3. **CHANGELOG格式**：严格按照模板格式编写，保持一致性
4. **文件保存顺序**：
   - 先保存旧版本到 `versions/` 目录
   - 再更新主 `spec.md` 文件
   - 最后更新 `VERSION` 和 `CHANGELOG.md`
5. **错误处理**：如果版本管理操作失败，应该提示用户但不应阻止Spec更新操作

---

*此模块用于统一管理Spec版本，确保所有命令使用一致的版本管理流程。*

