# Quản lý Rules - Hướng dẫn sử dụng

## Tổng quan

Hệ thống quản lý rules đã được nâng cấp với các chức năng mới cho phép:

- **Xem chi tiết rule**: Hiển thị đầy đủ thông tin về rule
- **Thêm rule mới**: Tạo rule tùy chỉnh
- **Chỉnh sửa rule**: Cập nhật thông tin rule
- **Test rule**: Kiểm tra rule trên code mẫu
- **Import/Export**: Nhập/xuất rules từ file
- **Tìm kiếm và lọc**: Tìm kiếm rules theo nhiều tiêu chí

## Các chức năng chính

### 1. Xem danh sách Rules

#### RuleList Component
- Hiển thị danh sách tất cả rules với thống kê
- Tìm kiếm theo tên và mô tả
- Lọc theo category, scanner, severity
- Chỉ hiển thị rules đã enable
- Thống kê theo category

#### Cách sử dụng:
```jsx
import RuleList from './components/Settings/RuleList';

// Hiển thị với detail view
<RuleList showDetailView={true} />

// Hiển thị không có detail view (cho selection)
<RuleList showDetailView={false} onRuleSelect={handleRuleSelect} />
```

### 2. Xem chi tiết Rule

#### RuleDetailView Component
- Hiển thị đầy đủ thông tin rule
- Chỉnh sửa thông tin rule
- Test rule trên code mẫu
- Export rule ra file
- Xem metadata và thống kê sử dụng

#### Các tab thông tin:
- **Details**: Thông tin cơ bản (tên, mô tả, category, severity)
- **Content**: Nội dung rule (YAML/JSON)
- **Metadata**: Thông tin tạo, sửa, tác giả, version
- **Usage**: Hướng dẫn sử dụng và ví dụ

#### Cách sử dụng:
```jsx
import RuleDetailView from './components/Settings/RuleDetailView';

<RuleDetailView 
  ruleId={ruleId}
  onClose={handleClose}
  onUpdate={handleUpdate}
/>
```

### 3. Thêm Rule mới

#### Dialog thêm rule với các trường:
- **Name**: Tên rule
- **Description**: Mô tả rule
- **Category**: Loại rule (security, performance, style, memory, quality)
- **Scanner**: Tool sử dụng (semgrep, snyk, clangtidy, cppcheck)
- **Content**: Nội dung rule (YAML/JSON)
- **Enabled**: Bật/tắt rule

#### Cách sử dụng:
```jsx
// Trong RuleSettings component
const handleOpenAddDialog = () => {
  setDialogType('add');
  setNewRule({
    name: '',
    description: '',
    category: 'security',
    scanner: 'semgrep',
    content: '',
    enabled: true
  });
  setOpenDialog(true);
};
```

### 4. API Services

#### Các hàm mới trong ruleService.js:

```javascript
// Lấy rule theo ID
export const getRuleById = async (ruleId) => { ... }

// Lấy rules theo category
export const getRulesByCategory = async (category) => { ... }

// Lấy rules theo scanner
export const getRulesByScanner = async (scanner) => { ... }

// Lấy rules đã enable
export const getEnabledRules = async () => { ... }

// Enable/Disable rule
export const toggleRuleStatus = async (ruleId, enabled) => { ... }

// Lấy thống kê rules
export const getRuleStats = async () => { ... }

// Import rules từ file
export const importRules = async (file) => { ... }

// Export rules ra file
export const exportRules = async (format = 'json') => { ... }

// Validate rule content
export const validateRule = async (ruleContent) => { ... }

// Test rule trên sample code
export const testRule = async (ruleId, sampleCode) => { ... }

// Lấy rule templates
export const getRuleTemplates = async () => { ... }

// Tạo rule từ template
export const createRuleFromTemplate = async (templateId, customizations) => { ... }
```

## Cấu trúc Rule

### Model Rule:
```javascript
{
  id: string,
  name: string,
  description: string,
  category: 'security' | 'performance' | 'style' | 'memory' | 'quality',
  severity: 'critical' | 'high' | 'medium' | 'low',
  scanner: 'semgrep' | 'snyk' | 'clangtidy' | 'cppcheck',
  content: string, // YAML/JSON content
  path: string, // File path
  enabled: boolean,
  author: string,
  version: string,
  createdAt: Date,
  updatedAt: Date,
  usageCount: number,
  successRate: number,
  lastUsed: Date,
  examples: string,
  isCustom: boolean
}
```

## Ví dụ sử dụng

### 1. Tạo rule mới:
```javascript
const newRule = {
  name: "Buffer Overflow Detection",
  description: "Detect potential buffer overflow vulnerabilities",
  category: "security",
  severity: "high",
  scanner: "semgrep",
  content: `
rules:
  - id: buffer-overflow
    pattern: strcpy($DST, $SRC)
    message: "Potential buffer overflow detected"
    severity: WARNING
  `,
  enabled: true
};

await createRule(newRule);
```

### 2. Test rule:
```javascript
const sampleCode = `
#include <string.h>
char buffer[10];
strcpy(buffer, "very long string that might overflow");
`;

const results = await testRule(ruleId, sampleCode);
console.log(results.matches); // Kết quả test
```

### 3. Import rules từ file:
```javascript
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];
await importRules(file);
```

### 4. Export rules:
```javascript
const blob = await exportRules('json');
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'rules_export.json';
a.click();
```

## Tính năng nâng cao

### 1. Validation
- Tự động validate rule content khi tạo/sửa
- Kiểm tra syntax YAML/JSON
- Validate pattern matching

### 2. Testing
- Test rule trên code mẫu
- Hiển thị kết quả match
- Highlight code có vấn đề

### 3. Statistics
- Thống kê số lượng rules theo category
- Tỷ lệ success của rule
- Số lần sử dụng rule

### 4. Templates
- Rule templates có sẵn
- Tạo rule từ template
- Customize template

## Lưu ý

1. **Authentication**: Tất cả API calls cần token authentication
2. **Error Handling**: Xử lý lỗi với snackbar notifications
3. **Loading States**: Hiển thị loading khi fetch data
4. **Responsive Design**: UI responsive cho mobile và desktop
5. **Accessibility**: Hỗ trợ keyboard navigation và screen readers

## Troubleshooting

### Lỗi thường gặp:

1. **Failed to fetch rules**: Kiểm tra API endpoint và authentication
2. **Invalid rule content**: Validate YAML/JSON syntax
3. **Test failed**: Kiểm tra rule pattern và sample code
4. **Import failed**: Kiểm tra file format và content

### Debug:
```javascript
// Enable debug logging
localStorage.setItem('debug', 'ruleService');

// Check API response
console.log('API Response:', response);
``` 