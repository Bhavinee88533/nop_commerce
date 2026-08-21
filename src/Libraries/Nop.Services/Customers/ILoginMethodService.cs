namespace Nop.Services.Customers;

/// <summary>
/// Interface for login method service
/// </summary>
public partial interface ILoginMethodService
{
    /// <summary>
    /// Gets the current login method for the session
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous operation
    /// The task result contains the login method (OtpEmail or OtpMobile)
    /// </returns>
    Task<string> GetCurrentLoginMethodAsync();

    /// <summary>
    /// Sets the login method for the current session
    /// </summary>
    /// <param name="loginMethod">Login method (OtpEmail or OtpMobile)</param>
    /// <returns>A task that represents the asynchronous operation</returns>
    Task SetCurrentLoginMethodAsync(string loginMethod);

    /// <summary>
    /// Gets the admin-configured default login method
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous operation
    /// The task result contains the default login method
    /// </returns>
    Task<string> GetDefaultLoginMethodAsync();

    /// <summary>
    /// Checks if user is allowed to change login method during session
    /// </summary>
    /// <returns>
    /// A task that represents the asynchronous operation
    /// The task result contains true if allowed, false otherwise
    /// </returns>
    Task<bool> CanUserChangeLoginMethodAsync();

    /// <summary>
    /// Clears the login method from session
    /// </summary>
    void ClearLoginMethod();
}
