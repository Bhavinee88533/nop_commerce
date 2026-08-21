using Microsoft.Extensions.Logging;
using Nop.Core;
using Nop.Data;
using Nop.Plugin.Widgets.BannerManagement.Domain;
using Nop.Services.Media;

namespace Nop.Plugin.Widgets.BannerManagement.Services;

public class BannerService : IBannerService
{
    private readonly IRepository<Banner> _bannerRepository;
    private readonly ILogger<BannerService> _logger;
    private readonly IPictureService _pictureService;

    public BannerService(IRepository<Banner> bannerRepository,
        ILogger<BannerService> logger,
        IPictureService pictureService)
    {
        _bannerRepository = bannerRepository;
        _logger = logger;
        _pictureService = pictureService;
    }

    public async Task<Banner> GetBannerByIdAsync(int bannerId)
    {
        return await _bannerRepository.GetByIdAsync(bannerId);
    }

    public async Task<IPagedList<Banner>> GetAllBannersAsync(int pageIndex = 0, int pageSize = int.MaxValue)
    {
        var banners = await _bannerRepository.GetAllAsync(query => query.OrderBy(banner => banner.DisplayOrder)
            .ThenByDescending(banner => banner.UpdatedOnUtc)
            .ThenBy(banner => banner.Id));

        return new PagedList<Banner>(banners.ToList(), pageIndex, pageSize);
    }

    public async Task<IList<Banner>> GetActiveBannersForHomePageAsync()
    {
        var banners = await _bannerRepository.GetAllAsync(query => query.Where(banner => banner.IsActive));

        return banners
            .Where(banner => banner.ShowOnHomePage)
            .Where(banner => IsBannerCurrentlyPublished(banner))
            .OrderBy(banner => banner.DisplayOrder)
            .ThenByDescending(banner => banner.UpdatedOnUtc)
            .ThenBy(banner => banner.Id)
            .ToList();
    }

    public async Task<IList<Banner>> GetActiveBannersForCategoryAsync(int categoryId)
    {
        var banners = await _bannerRepository.GetAllAsync(query => query.Where(banner => banner.IsActive));

        return banners
            .Where(banner => banner.CategoryId.HasValue && banner.CategoryId.Value == categoryId)
            .Where(banner => IsBannerCurrentlyPublished(banner))
            .OrderBy(banner => banner.DisplayOrder)
            .ThenByDescending(banner => banner.UpdatedOnUtc)
            .ThenBy(banner => banner.Id)
            .ToList();
    }

    public async Task<IList<Banner>> GetAllBannersForCleanupAsync()
    {
        return await _bannerRepository.GetAllAsync(query => query.OrderBy(banner => banner.Id));
    }

    public async Task InsertBannerAsync(Banner banner)
    {
        ArgumentNullException.ThrowIfNull(banner);

        banner.CreatedOnUtc = DateTime.UtcNow;
        banner.UpdatedOnUtc = banner.CreatedOnUtc;
        await _bannerRepository.InsertAsync(banner);
        _logger.LogInformation("BannerManagementPlugin: Banner created. BannerId={BannerId}, Title={Title}", banner.Id, banner.Title);
    }

    public async Task UpdateBannerAsync(Banner banner)
    {
        ArgumentNullException.ThrowIfNull(banner);

        banner.UpdatedOnUtc = DateTime.UtcNow;
        await _bannerRepository.UpdateAsync(banner);
        _logger.LogInformation("BannerManagementPlugin: Banner updated. BannerId={BannerId}, Title={Title}", banner.Id, banner.Title);
    }

    public async Task DeleteBannerAsync(Banner banner)
    {
        ArgumentNullException.ThrowIfNull(banner);

        if (banner.PictureId > 0)
        {
            var picture = await _pictureService.GetPictureByIdAsync(banner.PictureId);
            if (picture != null)
                await _pictureService.DeletePictureAsync(picture);
        }

        await _bannerRepository.DeleteAsync(banner);
        _logger.LogInformation("BannerManagementPlugin: Banner deleted. BannerId={BannerId}, Title={Title}", banner.Id, banner.Title);
    }

    public string ResolveRedirectUrl(Banner banner)
    {
        if (banner == null || string.IsNullOrWhiteSpace(banner.RedirectUrl))
            return string.Empty;

        if (banner.RedirectUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || banner.RedirectUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            || banner.RedirectUrl.StartsWith("/", StringComparison.OrdinalIgnoreCase))
        {
            return banner.RedirectUrl;
        }

        return $"/{banner.RedirectUrl.TrimStart('~').TrimStart('/')}";
    }

    public bool IsBannerCurrentlyPublished(Banner banner, DateTime? utcNow = null)
    {
        return banner != null && banner.IsActive;
    }
}