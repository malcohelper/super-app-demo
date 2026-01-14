import Foundation
import React

@objc(AuthModule)
class AuthModule: RCTEventEmitter {
  
  private let tokenManager = SecureTokenManager.shared
  private let authService = AuthService.shared
  
  // MARK: - RCTEventEmitter Override
  
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  override func supportedEvents() -> [String]! {
    return ["auth_state_changed"]
  }
  
  // MARK: - Authentication Methods
  
  /**
   * Login with email and password
   * Calls backend API and saves token to Keychain
   */
  @objc
  func login(
    _ email: String,
    password: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      do {
        let userInfo = try await authService.login(email: email, password: password)
        
        // Emit auth state changed event
        await MainActor.run {
          self.sendEvent(withName: "auth_state_changed", body: [
            "isAuthenticated": true,
            "userInfo": userInfo
          ])
        }
        
        resolve(userInfo)
      } catch let authError as AuthError {
        let errorCode = authError.errorCode
        let errorMessage = authError.errorDescription ?? "Login failed"
        reject(errorCode, errorMessage, authError)
      } catch {
        reject("LOGIN_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  /**
   * Signup with email, password, and display name
   * Calls backend API and saves token to Keychain
   */
  @objc
  func signup(
    _ email: String,
    password: String,
    displayName: String?,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      do {
        let userInfo = try await authService.signup(
          email: email,
          password: password,
          displayName: displayName
        )
        
        // Emit auth state changed event
        await MainActor.run {
          self.sendEvent(withName: "auth_state_changed", body: [
            "isAuthenticated": true,
            "userInfo": userInfo
          ])
        }
        
        resolve(userInfo)
      } catch let authError as AuthError {
        let errorCode = authError.errorCode
        let errorMessage = authError.errorDescription ?? "Signup failed"
        reject(errorCode, errorMessage, authError)
      } catch {
        reject("SIGNUP_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  /**
   * Logout - clear all auth data
   */
  @objc
  func logout(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      try authService.logout()
      
      // Emit auth state changed event
      sendEvent(withName: "auth_state_changed", body: [
        "isAuthenticated": false,
        "userInfo": NSNull()
      ])
      
      resolve(nil)
    } catch {
      reject("LOGOUT_ERROR", "Logout failed: \(error.localizedDescription)", error)
    }
  }
  
  // MARK: - Storage Methods (for backward compatibility)
  
  /**
   * Save authentication state (token + user info) to Keychain
   */
  @objc
  func saveAuthState(
    _ token: String,
    userInfo: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      // Save token
      try tokenManager.saveToken(token)
      
      // Save user info
      if let userDict = userInfo as? [String: Any] {
        try tokenManager.saveUserInfo(userDict)
      }
      
      // Emit auth state changed event
      sendEvent(withName: "auth_state_changed", body: [
        "isAuthenticated": true,
        "userInfo": userInfo
      ])
      
      resolve(nil)
    } catch {
      reject("SAVE_ERROR", "Failed to save auth state: \(error.localizedDescription)", error)
    }
  }
  
  /**
   * Load authentication state from Keychain
   */
  @objc
  func loadAuthState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      guard let token = try tokenManager.getToken(),
            let userInfo = try tokenManager.getUserInfo(),
            let timestamp = try tokenManager.getTokenTimestamp() else {
        // No auth state found
        resolve(NSNull())
        return
      }
      
      let result: [String: Any] = [
        "token": token,
        "userInfo": userInfo,
        "timestamp": timestamp
      ]
      
      resolve(result)
    } catch {
      reject("LOAD_ERROR", "Failed to load auth state: \(error.localizedDescription)", error)
    }
  }
  
  /**
   * Clear authentication state from Keychain
   */
  @objc
  func clearAuthState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      try tokenManager.clearAll()
      
      // Emit auth state changed event
      sendEvent(withName: "auth_state_changed", body: [
        "isAuthenticated": false,
        "userInfo": NSNull()
      ])
      
      resolve(nil)
    } catch {
      reject("CLEAR_ERROR", "Failed to clear auth state: \(error.localizedDescription)", error)
    }
  }
  
  /**
   * Get current authentication state (for Mini Apps - read-only)
   */
  @objc
  func getAuthState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      guard let token = try tokenManager.getToken(),
            let userInfo = try tokenManager.getUserInfo() else {
        // Not authenticated
        resolve([
          "isAuthenticated": false,
          "userInfo": NSNull()
        ])
        return
      }
      
      let result: [String: Any] = [
        "isAuthenticated": true,
        "token": token,
        "userInfo": userInfo
      ]
      
      resolve(result)
    } catch {
      reject("GET_STATE_ERROR", "Failed to get auth state: \(error.localizedDescription)", error)
    }
  }
  
  /**
   * Check if token exists in Keychain
   */
  @objc
  func hasToken(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      let token = try tokenManager.getToken()
      resolve(token != nil)
    } catch {
      reject("CHECK_ERROR", "Failed to check token: \(error.localizedDescription)", error)
    }
  }
  
  /**
   * Get token timestamp for expiration check
   */
  @objc
  func getTokenTimestamp(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      if let timestamp = try tokenManager.getTokenTimestamp() {
        resolve(timestamp)
      } else {
        resolve(NSNull())
      }
    } catch {
      reject("TIMESTAMP_ERROR", "Failed to get timestamp: \(error.localizedDescription)", error)
    }
  }
}

