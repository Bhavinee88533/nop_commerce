using System.ComponentModel.DataAnnotations;
using AwesomeAssertions;
using Nop.Plugin.Misc.RiderManagement.Models.Admin;
using NUnit.Framework;

namespace Nop.Tests.Nop.Plugins.Tests.RiderManagement;

/// <summary>
/// Unit tests for <see cref="RiderModel"/> data annotation validation.
/// Covers:
///   - Name: required, letters only (no digits), max 400 chars
///   - Phone: required, digits/valid phone chars only (no letters), max 50 chars
///   - Email: required, valid email format, max 1000 chars
///   - CustomerId: must be >= 1 (positive number)
/// </summary>
[TestFixture]
public class RiderModelValidationTests
{
    // ── Helpers ──────────────────────────────────────────────────────────────

    private static IList<ValidationResult> Validate(RiderModel model)
    {
        var context = new ValidationContext(model);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, context, results, validateAllProperties: true);
        return results;
    }

    private static RiderModel ValidModel() => new()
    {
        Name       = "Ali Raza",
        Phone      = "03001234567",
        Email      = "ali@example.com",
        StatusId   = 0,
        IsOnline   = false,
        CustomerId = 5
    };

    // ── Valid model ──────────────────────────────────────────────────────────

    [Test]
    public void RiderModel_IsValid_WhenAllFieldsAreCorrect()
    {
        var errors = Validate(ValidModel());

        errors.Should().BeEmpty();
    }

    // ── Name validation ──────────────────────────────────────────────────────

    [Test]
    public void RiderModel_IsInvalid_WhenNameIsEmpty()
    {
        var model = ValidModel();
        model.Name = "";

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.Name)));
    }

    [Test]
    public void RiderModel_IsInvalid_WhenNameIsNull()
    {
        var model = ValidModel();
        model.Name = null;

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.Name)));
    }

    [Test]
    public void RiderModel_IsInvalid_WhenNameContainsDigits()
    {
        var model = ValidModel();
        model.Name = "Ali123";

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.Name)));
    }

    [Test]
    public void RiderModel_IsInvalid_WhenNameExceedsMaxLength()
    {
        var model = ValidModel();
        model.Name = new string('A', 401);

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.Name)));
    }

    [TestCase("Ali Raza")]
    [TestCase("Sara-Khan")]
    [TestCase("O'Brien")]
    [TestCase("Dr. Ahmed")]
    public void RiderModel_IsValid_ForAcceptableNameFormats(string name)
    {
        var model = ValidModel();
        model.Name = name;

        var errors = Validate(model);

        errors.Should().NotContain(e => e.MemberNames.Contains(nameof(RiderModel.Name)));
    }

    // ── Phone validation ─────────────────────────────────────────────────────

    [Test]
    public void RiderModel_IsInvalid_WhenPhoneIsEmpty()
    {
        var model = ValidModel();
        model.Phone = "";

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.Phone)));
    }

    [Test]
    public void RiderModel_IsInvalid_WhenPhoneContainsLetters()
    {
        var model = ValidModel();
        model.Phone = "0300abc1234";

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.Phone)));
    }

    [Test]
    public void RiderModel_IsInvalid_WhenPhoneExceedsMaxLength()
    {
        var model = ValidModel();
        model.Phone = new string('1', 51);

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.Phone)));
    }

    [TestCase("03001234567")]
    [TestCase("+923001234567")]
    [TestCase("+1 800 555 1234")]
    [TestCase("0300-1234567")]
    public void RiderModel_IsValid_ForAcceptablePhoneFormats(string phone)
    {
        var model = ValidModel();
        model.Phone = phone;

        var errors = Validate(model);

        errors.Should().NotContain(e => e.MemberNames.Contains(nameof(RiderModel.Phone)));
    }

    // ── Email validation ─────────────────────────────────────────────────────

    [Test]
    public void RiderModel_IsInvalid_WhenEmailIsEmpty()
    {
        var model = ValidModel();
        model.Email = "";

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.Email)));
    }

    [Test]
    public void RiderModel_IsInvalid_WhenEmailFormatIsWrong()
    {
        var model = ValidModel();
        model.Email = "not-an-email";

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.Email)));
    }

    [Test]
    public void RiderModel_IsInvalid_WhenEmailExceedsMaxLength()
    {
        var model = ValidModel();
        model.Email = new string('a', 993) + "@test.com"; // 993 + 9 = 1002 chars > 1000

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.Email)));
    }

    [TestCase("user@example.com")]
    [TestCase("rider.name+tag@domain.co.uk")]
    public void RiderModel_IsValid_ForAcceptableEmailFormats(string email)
    {
        var model = ValidModel();
        model.Email = email;

        var errors = Validate(model);

        errors.Should().NotContain(e => e.MemberNames.Contains(nameof(RiderModel.Email)));
    }

    // ── CustomerId validation ────────────────────────────────────────────────

    [Test]
    public void RiderModel_IsInvalid_WhenCustomerIdIsZero()
    {
        var model = ValidModel();
        model.CustomerId = 0;

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.CustomerId)));
    }

    [Test]
    public void RiderModel_IsInvalid_WhenCustomerIdIsNegative()
    {
        var model = ValidModel();
        model.CustomerId = -1;

        var errors = Validate(model);

        errors.Should().Contain(e => e.MemberNames.Contains(nameof(RiderModel.CustomerId)));
    }

    [Test]
    public void RiderModel_IsValid_WhenCustomerIdIsPositive()
    {
        var model = ValidModel();
        model.CustomerId = 1;

        var errors = Validate(model);

        errors.Should().NotContain(e => e.MemberNames.Contains(nameof(RiderModel.CustomerId)));
    }
}
