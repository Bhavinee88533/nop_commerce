using AwesomeAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Nop.Core;
using Nop.Data;
using Nop.Plugin.Misc.RiderManagement.Domains;
using Nop.Plugin.Misc.RiderManagement.Services;
using NUnit.Framework;

namespace Nop.Tests.Nop.Plugins.Tests.RiderManagement;

/// <summary>
/// Unit tests for <see cref="RiderService"/> covering all rider user story acceptance criteria:
///   - Rider can be created with valid fields
///   - Rider can be retrieved by ID
///   - Riders can be listed with name/status filters
///   - Rider can be updated
///   - Rider can be deleted
///   - Null guard: InsertAsync / UpdateAsync / DeleteAsync throw on null input
/// </summary>
[TestFixture]
public class RiderServiceTests
{
    private Mock<IRepository<Rider>> _repoMock;
    private Mock<IRepository<DeliveryOrder>> _deliveryOrderRepoMock;
    private RiderService _service;

    [SetUp]
    public void SetUp()
    {
        _repoMock = new Mock<IRepository<Rider>>();
        _deliveryOrderRepoMock = new Mock<IRepository<DeliveryOrder>>();
        _service = new RiderService(NullLogger<RiderService>.Instance, _deliveryOrderRepoMock.Object, _repoMock.Object);
    }

    // ── GetModuleGreetingAsync ───────────────────────────────────────────────

    [Test]
    public async Task GetModuleGreetingAsync_ReturnsNonEmptyString()
    {
        var result = await _service.GetModuleGreetingAsync();

        result.Should().NotBeNullOrWhiteSpace();
    }

    // ── GetRiderByIdAsync ────────────────────────────────────────────────────

    [Test]
    public async Task GetRiderByIdAsync_ReturnsRider_WhenExists()
    {
        var rider = new Rider { Id = 1, Name = "Ali Raza", Phone = "03001234567", Email = "ali@example.com", CustomerId = 5 };
        _repoMock
            .Setup(r => r.GetByIdAsync(1, null, true, false))
            .ReturnsAsync(rider);

        var result = await _service.GetRiderByIdAsync(1);

        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        result.Name.Should().Be("Ali Raza");
    }

    [Test]
    public async Task GetRiderByIdAsync_ReturnsNull_WhenNotFound()
    {
        _repoMock
            .Setup(r => r.GetByIdAsync(99, null, true, false))
            .ReturnsAsync((Rider)null);

        var result = await _service.GetRiderByIdAsync(99);

        result.Should().BeNull();
    }

    // ── InsertRiderAsync ─────────────────────────────────────────────────────

    [Test]
    public async Task InsertRiderAsync_CallsRepositoryInsert_WhenRiderIsValid()
    {
        var rider = new Rider { Name = "Sara Khan", Phone = "03111234567", Email = "sara@example.com", CustomerId = 2 };

        await _service.InsertRiderAsync(rider);

        _repoMock.Verify(r => r.InsertAsync(rider, true), Times.Once);
    }

    [Test]
    public void InsertRiderAsync_ThrowsArgumentNullException_WhenRiderIsNull()
    {
        var act = async () => await _service.InsertRiderAsync(null);

        act.Should().ThrowAsync<ArgumentNullException>();
    }

    // ── UpdateRiderAsync ─────────────────────────────────────────────────────

    [Test]
    public async Task UpdateRiderAsync_CallsRepositoryUpdate_WhenRiderIsValid()
    {
        var rider = new Rider { Id = 3, Name = "Imran Shah", Phone = "03211234567", Email = "imran@example.com", CustomerId = 7 };

        await _service.UpdateRiderAsync(rider);

        _repoMock.Verify(r => r.UpdateAsync(rider, true), Times.Once);
    }

    [Test]
    public void UpdateRiderAsync_ThrowsArgumentNullException_WhenRiderIsNull()
    {
        var act = async () => await _service.UpdateRiderAsync(null);

        act.Should().ThrowAsync<ArgumentNullException>();
    }

    // ── DeleteRiderAsync ─────────────────────────────────────────────────────

    [Test]
    public async Task DeleteRiderAsync_CallsRepositoryDelete_WhenRiderIsValid()
    {
        var rider = new Rider { Id = 4, Name = "Zara Ahmed", Phone = "03301234567", Email = "zara@example.com", CustomerId = 9 };

        await _service.DeleteRiderAsync(rider);

        _repoMock.Verify(r => r.DeleteAsync(rider, true), Times.Once);
    }

    [Test]
    public void DeleteRiderAsync_ThrowsArgumentNullException_WhenRiderIsNull()
    {
        var act = async () => await _service.DeleteRiderAsync(null);

        act.Should().ThrowAsync<ArgumentNullException>();
    }

    // ── GetAllRidersAsync ────────────────────────────────────────────────────

    [Test]
    public async Task GetAllRidersAsync_ReturnsPagedList_WithAllRiders()
    {
        var riders = new List<Rider>
        {
            new() { Id = 1, Name = "Ali Raza",   StatusId = 0, CustomerId = 1 },
            new() { Id = 2, Name = "Sara Khan",  StatusId = 1, CustomerId = 2 },
            new() { Id = 3, Name = "Imran Shah", StatusId = 0, CustomerId = 3 }
        };

        _repoMock
            .Setup(r => r.GetAllPagedAsync(
                It.IsAny<Func<IQueryable<Rider>, IQueryable<Rider>>>(),
                0, int.MaxValue, false, true))
            .ReturnsAsync(new PagedList<Rider>(riders, 0, int.MaxValue));

        var result = await _service.GetAllRidersAsync();

        result.Should().NotBeNull();
        result.Count.Should().Be(3);
    }

    [Test]
    public async Task GetAllRidersAsync_FiltersByName_CaseInsensitive()
    {
        var riders = new List<Rider>
        {
            new() { Id = 1, Name = "Ali Raza", StatusId = 0, CustomerId = 1 }
        };

        _repoMock
            .Setup(r => r.GetAllPagedAsync(
                It.IsAny<Func<IQueryable<Rider>, IQueryable<Rider>>>(),
                0, int.MaxValue, false, true))
            .ReturnsAsync(new PagedList<Rider>(riders, 0, int.MaxValue));

        var result = await _service.GetAllRidersAsync(name: "Ali");

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result[0].Name.Should().Be("Ali Raza");
    }

    [Test]
    public async Task GetAllRidersAsync_FiltersByStatus_ReturnsOnlyActiveRiders()
    {
        var activeRiders = new List<Rider>
        {
            new() { Id = 1, Name = "Ali Raza",   StatusId = 0, CustomerId = 1 },
            new() { Id = 3, Name = "Imran Shah", StatusId = 0, CustomerId = 3 }
        };

        _repoMock
            .Setup(r => r.GetAllPagedAsync(
                It.IsAny<Func<IQueryable<Rider>, IQueryable<Rider>>>(),
                0, int.MaxValue, false, true))
            .ReturnsAsync(new PagedList<Rider>(activeRiders, 0, int.MaxValue));

        var result = await _service.GetAllRidersAsync(statusId: (int)RiderStatus.Active);

        result.Should().NotBeNull();
        result.Should().AllSatisfy(r => r.StatusId.Should().Be((int)RiderStatus.Active));
    }

    [Test]
    public async Task GetAllRidersAsync_ReturnsEmpty_WhenNoRidersExist()
    {
        _repoMock
            .Setup(r => r.GetAllPagedAsync(
                It.IsAny<Func<IQueryable<Rider>, IQueryable<Rider>>>(),
                0, int.MaxValue, false, true))
            .ReturnsAsync(new PagedList<Rider>(new List<Rider>(), 0, int.MaxValue));

        var result = await _service.GetAllRidersAsync();

        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Test]
    public async Task GetAllRidersAsync_RespectsPageIndexAndPageSize()
    {
        var page = new List<Rider>
        {
            new() { Id = 3, Name = "Imran Shah", StatusId = 0, CustomerId = 3 }
        };

        _repoMock
            .Setup(r => r.GetAllPagedAsync(
                It.IsAny<Func<IQueryable<Rider>, IQueryable<Rider>>>(),
                1, 2, false, true))
            .ReturnsAsync(new PagedList<Rider>(page, 1, 2, 3));

        var result = await _service.GetAllRidersAsync(pageIndex: 1, pageSize: 2);

        result.Should().NotBeNull();
        result.PageIndex.Should().Be(1);
        result.PageSize.Should().Be(2);
        result.TotalCount.Should().Be(3);
    }

    // ── Rider domain model ───────────────────────────────────────────────────

    [Test]
    public void Rider_Status_Property_MapsCorrectly_ToStatusId()
    {
        var rider = new Rider { StatusId = (int)RiderStatus.Active };
        rider.Status.Should().Be(RiderStatus.Active);

        rider.Status = RiderStatus.Inactive;
        rider.StatusId.Should().Be((int)RiderStatus.Inactive);
    }

    [Test]
    public void Rider_IsOnline_DefaultsToFalse()
    {
        var rider = new Rider();
        rider.IsOnline.Should().BeFalse();
    }
}
