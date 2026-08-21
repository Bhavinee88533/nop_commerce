using Nop.Core;
using Nop.Plugin.Widgets.BannerManagement.Domain;

namespace Nop.Plugin.Widgets.BannerManagement.Services;

public interface IBannerService
{
    Task<Banner> GetBannerByIdAsync(int bannerId);

    Task<IPagedList<Banner>> GetAllBannersAsync(int pageIndex = 0, int pageSize = int.MaxValue);

    Task<IList<Banner>> GetActiveBannersForHomePageAsync();

    Task<IList<Banner>> GetActiveBannersForCategoryAsync(int categoryId);

    Task<IList<Banner>> GetAllBannersForCleanupAsync();

    Task InsertBannerAsync(Banner banner);

    Task UpdateBannerAsync(Banner banner);

    Task DeleteBannerAsync(Banner banner);

    string ResolveRedirectUrl(Banner banner);

    bool IsBannerCurrentlyPublished(Banner banner, DateTime? utcNow = null);
}