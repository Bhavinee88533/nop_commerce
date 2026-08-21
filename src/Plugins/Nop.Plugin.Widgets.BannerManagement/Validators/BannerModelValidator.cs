using FluentValidation;
using Nop.Plugin.Widgets.BannerManagement.Models;
using Nop.Services.Localization;
using Nop.Web.Framework.Validators;

namespace Nop.Plugin.Widgets.BannerManagement.Validators;

public class BannerModelValidator : BaseNopValidator<BannerModel>
{
    public BannerModelValidator(ILocalizationService localizationService)
    {
        RuleFor(model => model.Title)
            .NotEmpty()
            .WithMessageAwait(localizationService.GetResourceAsync("Plugins.Widgets.BannerManagement.Fields.Title.Required"));

        RuleFor(model => model.PictureId)
            .GreaterThan(0)
            .WithMessageAwait(localizationService.GetResourceAsync("Plugins.Widgets.BannerManagement.Fields.PictureId.Required"));

        RuleFor(model => model.ButtonText)
            .NotEmpty()
            .WithMessageAwait(localizationService.GetResourceAsync("Plugins.Widgets.BannerManagement.Fields.ButtonText.Required"));

        RuleFor(model => model.RedirectUrl)
            .NotEmpty()
            .WithMessageAwait(localizationService.GetResourceAsync("Plugins.Widgets.BannerManagement.Fields.RedirectUrl.Required"));

        RuleFor(model => model.DisplayOrder)
            .GreaterThanOrEqualTo(0)
            .WithMessageAwait(localizationService.GetResourceAsync("Plugins.Widgets.BannerManagement.Fields.DisplayOrder.Range"));
    }
}