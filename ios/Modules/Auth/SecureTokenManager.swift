import Foundation
import Security

/**
 * SecureTokenManager
 * 
 * Manages secure storage of authentication tokens and user data using iOS Keychain.
 * Provides encrypted storage that persists across app launches and is isolated from other apps.
 */
class SecureTokenManager {
  
  // MARK: - Singleton
  static let shared = SecureTokenManager()
  
  // MARK: - Constants
  private let serviceName = "com.hostapp.auth"
  
  private enum KeychainKey: String {
    case token = "auth_token"
    case tokenTimestamp = "auth_token_timestamp"
    case userInfo = "auth_user_info"
  }
  
  // MARK: - Private Init
  private init() {}
  
  // MARK: - Public Methods
  
  /**
   * Save authentication token to Keychain
   */
  func saveToken(_ token: String) throws {
    try saveString(token, forKey: .token)
    
    // Save timestamp for expiration tracking
    let timestamp = String(Int(Date().timeIntervalSince1970 * 1000))
    try saveString(timestamp, forKey: .tokenTimestamp)
  }
  
  /**
   * Retrieve authentication token from Keychain
   */
  func getToken() throws -> String? {
    return try getString(forKey: .token)
  }
  
  /**
   * Get token timestamp
   */
  func getTokenTimestamp() throws -> Int64? {
    guard let timestampStr = try getString(forKey: .tokenTimestamp) else {
      return nil
    }
    return Int64(timestampStr)
  }
  
  /**
   * Save user info to Keychain
   */
  func saveUserInfo(_ userInfo: [String: Any]) throws {
    let jsonData = try JSONSerialization.data(withJSONObject: userInfo)
    try saveData(jsonData, forKey: .userInfo)
  }
  
  /**
   * Retrieve user info from Keychain
   */
  func getUserInfo() throws -> [String: Any]? {
    guard let data = try getData(forKey: .userInfo) else {
      return nil
    }
    
    let userInfo = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    return userInfo
  }
  
  /**
   * Delete token from Keychain
   */
  func deleteToken() throws {
    try deleteItem(forKey: .token)
    try deleteItem(forKey: .tokenTimestamp)
  }
  
  /**
   * Delete user info from Keychain
   */
  func deleteUserInfo() throws {
    try deleteItem(forKey: .userInfo)
  }
  
  /**
   * Clear all authentication data from Keychain
   */
  func clearAll() throws {
    try deleteToken()
    try deleteUserInfo()
  }
  
  // MARK: - Private Keychain Methods
  
  /**
   * Save string to Keychain
   */
  private func saveString(_ value: String, forKey key: KeychainKey) throws {
    guard let data = value.data(using: .utf8) else {
      throw KeychainError.encodingError
    }
    try saveData(data, forKey: key)
  }
  
  /**
   * Get string from Keychain
   */
  private func getString(forKey key: KeychainKey) throws -> String? {
    guard let data = try getData(forKey: key) else {
      return nil
    }
    
    guard let string = String(data: data, encoding: .utf8) else {
      throw KeychainError.decodingError
    }
    
    return string
  }
  
  /**
   * Save data to Keychain
   */
  private func saveData(_ data: Data, forKey key: KeychainKey) throws {
    // First try to update existing item
    let query = keychainQuery(forKey: key)
    let attributes: [String: Any] = [
      kSecValueData as String: data
    ]
    
    let updateStatus = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
    
    if updateStatus == errSecItemNotFound {
      // Item doesn't exist, add it
      var addQuery = query
      addQuery[kSecValueData as String] = data
      
      let addStatus = SecItemAdd(addQuery as CFDictionary, nil)
      
      guard addStatus == errSecSuccess else {
        throw KeychainError.saveFailed(status: addStatus)
      }
    } else if updateStatus != errSecSuccess {
      throw KeychainError.saveFailed(status: updateStatus)
    }
  }
  
  /**
   * Get data from Keychain
   */
  private func getData(forKey key: KeychainKey) throws -> Data? {
    var query = keychainQuery(forKey: key)
    query[kSecReturnData as String] = true
    query[kSecMatchLimit as String] = kSecMatchLimitOne
    
    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    
    if status == errSecItemNotFound {
      return nil
    }
    
    guard status == errSecSuccess else {
      throw KeychainError.loadFailed(status: status)
    }
    
    guard let data = result as? Data else {
      throw KeychainError.unexpectedData
    }
    
    return data
  }
  
  /**
   * Delete item from Keychain
   */
  private func deleteItem(forKey key: KeychainKey) throws {
    let query = keychainQuery(forKey: key)
    let status = SecItemDelete(query as CFDictionary)
    
    // Ignore if item doesn't exist
    guard status == errSecSuccess || status == errSecItemNotFound else {
      throw KeychainError.deleteFailed(status: status)
    }
  }
  
  /**
   * Build Keychain query dictionary
   */
  private func keychainQuery(forKey key: KeychainKey) -> [String: Any] {
    return [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: serviceName,
      kSecAttrAccount as String: key.rawValue,
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
    ]
  }
}

// MARK: - Keychain Errors

enum KeychainError: Error {
  case encodingError
  case decodingError
  case saveFailed(status: OSStatus)
  case loadFailed(status: OSStatus)
  case deleteFailed(status: OSStatus)
  case unexpectedData
  
  var localizedDescription: String {
    switch self {
    case .encodingError:
      return "Failed to encode data"
    case .decodingError:
      return "Failed to decode data"
    case .saveFailed(let status):
      return "Failed to save to Keychain (status: \(status))"
    case .loadFailed(let status):
      return "Failed to load from Keychain (status: \(status))"
    case .deleteFailed(let status):
      return "Failed to delete from Keychain (status: \(status))"
    case .unexpectedData:
      return "Unexpected data format in Keychain"
    }
  }
}
