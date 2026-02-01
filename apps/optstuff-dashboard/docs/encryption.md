# 資料加密機制

本文件說明 OptStuff 使用的加密演算法與實作細節。

## 加密演算法

```text
演算法: AES-256-GCM (Authenticated Encryption)

特性:
- AES-256: 256-bit 對稱加密，目前最安全的標準
- GCM 模式: 提供加密 + 認證，可檢測資料篡改
- 隨機 IV: 每次加密產生不同密文
- AuthTag: 驗證資料完整性
```

## 密鑰派生 (HKDF)

HKDF (HMAC-based Extract-and-Expand Key Derivation Function) 用於從 master secret 安全地派生加密密鑰。

```text
演算法: HKDF (HMAC-based Extract-and-Expand Key Derivation Function)
標準: RFC 5869
```

### HKDF 流程

```text
                    Input Key Material (IKM)
                    API_KEY_ENCRYPTION_SECRET
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Extract Phase                                                          │
│  PRK = HMAC-SHA256(salt, IKM)                                          │
│  salt = "optstuff-api-key-v1"                                          │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Expand Phase                                                           │
│  OKM = HMAC-SHA256(PRK, info || 0x01)                                  │
│  info = "api-key-encryption"                                           │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
                    Output Key Material (OKM)
                    256-bit AES 加密密鑰
```

### HKDF 優勢

| 特性 | 說明 |
| ------ | ------ |
| 標準化 | RFC 5869 業界公認標準 |
| 可擴展 | 可從同一 master key 安全派生多個不同用途的密鑰 |
| 版本化 | Salt 包含版本號，便於未來 key rotation |
| 用途隔離 | Info 參數明確標識密鑰用途，防止誤用 |

## 加密格式

```text
加密後格式: {iv}:{authTag}:{ciphertext}

各部分:
- iv: 12 bytes (96 bits), base64 編碼
- authTag: 16 bytes (128 bits), base64 編碼
- ciphertext: 加密後的資料, base64 編碼

範例:
明文:    "pk_a1b2c3d4e5f6..."
加密後:  "MTIzNDU2Nzg5MDEy:YWJjZGVmZ2hpamtsbW5v:eHl6MTIzNDU2..."
```

## 加密流程

```typescript
// HKDF 常量 (RFC 5869)
const HKDF_ALGORITHM = "sha256";
const HKDF_SALT = "optstuff-api-key-v1";
const HKDF_INFO_ENCRYPTION = "api-key-encryption";

function getEncryptionKey(): Buffer {
  return Buffer.from(
    hkdfSync(
      HKDF_ALGORITHM,
      API_KEY_ENCRYPTION_SECRET,
      HKDF_SALT,
      HKDF_INFO_ENCRYPTION,
      32, // 256 bits
    ),
  );
}

function encryptApiKey(plaintext: string): string {
  // 1. 產生隨機 IV
  const iv = randomBytes(12);
  
  // 2. 使用 HKDF 派生加密密鑰
  const key = getEncryptionKey();
  
  // 3. AES-256-GCM 加密
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = cipher.update(plaintext) + cipher.final();
  const authTag = cipher.getAuthTag();
  
  // 4. 組合輸出
  return `${base64(iv)}:${base64(authTag)}:${base64(ciphertext)}`;
}
```

## 解密流程

```typescript
function decryptApiKey(encrypted: string): string {
  // 1. 分割並解碼
  const [iv, authTag, ciphertext] = encrypted.split(':').map(base64Decode);
  
  // 2. 使用 HKDF 派生加密密鑰
  const key = getEncryptionKey();
  
  // 3. AES-256-GCM 解密
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = decipher.update(ciphertext) + decipher.final();
  
  return plaintext;
}
```

## 安全性說明

### 為什麼選擇 AES-256-GCM？

1. **機密性**: AES-256 提供強大的加密保護
2. **完整性**: GCM 模式的 AuthTag 可檢測任何資料篡改
3. **效能**: 硬體加速支援，加解密速度快
4. **標準化**: 廣泛使用的業界標準

### 為什麼使用 HKDF？

見 [設計決策說明 - 為什麼用 HKDF 而不是簡單 Hash？](./design-decisions.md#83-為什麼用-hkdf-而不是簡單-hash)

## 延伸閱讀

- [系統架構](./architecture.md) - 密鑰層級總覽
- [設計決策說明](./design-decisions.md) - 各項設計的理由
- [安全最佳實踐](./security-best-practices.md) - 密鑰管理建議
