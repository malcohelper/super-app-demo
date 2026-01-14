import Foundation

/**
 * AuthService
 * 
 * Handles authentication API calls to backend and token management.
 * Provides login, signup, and user profile operations.
 */
class AuthService {
  
  // MARK: - Singleton
  static let shared = AuthService()
  
  // MARK: - Constants
  private let apiBaseURL = "https://super-app-case.web.app/api"
  private let tokenManager = SecureTokenManager.shared
  
  // MARK: - Data Models
  
  struct LoginRequest: Codable {
    let email: String
    let password: String
  }
  
  struct SignupRequest: Codable {
    let email: String
    let password: String
    let displayName: String?
  }
  
  struct AuthResponse: Codable {
    let success: Bool
    let data: AuthData?
    let error: ErrorResponse?
    let message: String?
  }
  
  struct AuthData: Codable {
    let uid: String
    let email: String
    let displayName: String
    let token: String
    let role: String
    let permissions: [String]
  }
  
  struct ErrorResponse: Codable {
    let code: String?
    let message: String
    let details: [String: Any]?
    
    enum CodingKeys: String, CodingKey {
      case code, message, details
    }
    
    init(from decoder: Decoder) throws {
      let container = try decoder.container(keyedBy: CodingKeys.self)
      code = try container.decodeIfPresent(String.self, forKey: .code)
      message = try container.decode(String.self, forKey: .message)
      // Skip details for now as it's complex to decode [String: Any]
      details = nil
    }
    
    func encode(to encoder: Encoder) throws {
      var container = encoder.container(keyedBy: CodingKeys.self)
      try container.encodeIfPresent(code, forKey: .code)
      try container.encode(message, forKey: .message)
      // Skip encoding details
    }
  }
  
  // MARK: - Private Init
  private init() {}
  
  // MARK: - Public Methods
  
  /**
   * Login with email and password
   */
  func login(email: String, password: String) async throws -> [String: Any] {
    let endpoint = "\(apiBaseURL)/auth/login"
    let requestBody = LoginRequest(email: email, password: password)
    
    print("[AuthService] Attempting login for: \(email)")
    
    let authData = try await performAuthRequest(endpoint: endpoint, body: requestBody)
    
    // Save token and user info to Keychain
    try tokenManager.saveToken(authData.token)
    
    let userInfo: [String: Any] = [
      "uid": authData.uid,
      "email": authData.email,
      "displayName": authData.displayName,
      "role": authData.role,
      "permissions": authData.permissions
    ]
    
    try tokenManager.saveUserInfo(userInfo)
    
    print("[AuthService] ✓ Login successful, saved to Keychain")
    
    return userInfo
  }
  
  /**
   * Signup with email, password, and display name
   */
  func signup(email: String, password: String, displayName: String?) async throws -> [String: Any] {
    let endpoint = "\(apiBaseURL)/auth/signup"
    let requestBody = SignupRequest(
      email: email,
      password: password,
      displayName: displayName
    )
    
    print("[AuthService] Attempting signup for: \(email)")
    
    let authData = try await performAuthRequest(endpoint: endpoint, body: requestBody)
    
    // Save token and user info to Keychain
    try tokenManager.saveToken(authData.token)
    
    let userInfo: [String: Any] = [
      "uid": authData.uid,
      "email": authData.email,
      "displayName": authData.displayName,
      "role": authData.role,
      "permissions": authData.permissions
    ]
    
    try tokenManager.saveUserInfo(userInfo)
    
    print("[AuthService] ✓ Signup successful, saved to Keychain")
    
    return userInfo
  }
  
  /**
   * Logout - clear all auth data
   */
  func logout() throws {
    try tokenManager.clearAll()
    print("[AuthService] ✓ Logged out, cleared Keychain")
  }
  
  /**
   * Get current user info from Keychain
   */
  func getCurrentUser() throws -> [String: Any]? {
    return try tokenManager.getUserInfo()
  }
  
  /**
   * Get current token from Keychain
   */
  func getCurrentToken() throws -> String? {
    return try tokenManager.getToken()
  }
  
  // MARK: - Private Methods
  
  /**
   * Perform authentication request to backend
   */
  private func performAuthRequest<T: Encodable>(
    endpoint: String,
    body: T
  ) async throws -> AuthData {
    guard let url = URL(string: endpoint) else {
      throw AuthError.invalidURL
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    // Encode request body
    let encoder = JSONEncoder()
    request.httpBody = try encoder.encode(body)
    
    // Perform request
    let (data, response) = try await URLSession.shared.data(for: request)
    
    // Check HTTP response
    guard let httpResponse = response as? HTTPURLResponse else {
      throw AuthError.invalidResponse
    }
    
    print("[AuthService] Response status: \(httpResponse.statusCode)")
    
    // Decode response
    let decoder = JSONDecoder()
    let authResponse = try decoder.decode(AuthResponse.self, from: data)
    
    // Check for success
    guard authResponse.success, let authData = authResponse.data else {
      let errorMessage = authResponse.error?.message ?? authResponse.message ?? "Authentication failed"
      throw AuthError.apiError(message: errorMessage)
    }
    
    return authData
  }
}

// MARK: - Auth Errors

enum AuthError: Error {
  case invalidURL
  case invalidResponse
  case apiError(message: String)
  case networkError(Error)
  
  var localizedDescription: String {
    switch self {
    case .invalidURL:
      return "Invalid API URL"
    case .invalidResponse:
      return "Invalid server response"
    case .apiError(let message):
      return message
    case .networkError(let error):
      return "Network error: \(error.localizedDescription)"
    }
  }
}
