using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BankingAPI.Data;
using BankingAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BillPaymentsController : ControllerBase
    {
        private readonly BankingContext _context;

        public BillPaymentsController(BankingContext context)
        {
            _context = context;
        }

        // GET: api/BillPayments with filtering and pagination
        [HttpGet]
        public async Task<ActionResult> GetBillPayments(
            [FromQuery] int? accountId = null,
            [FromQuery] string? biller = null,
            [FromQuery] DateTime? dateFrom = null,
            [FromQuery] DateTime? dateTo = null,
            [FromQuery] int page = 1,
            [FromQuery] int size = 10)
        {
            try
            {
                if (page < 1 || size < 1)
                {
                    return BadRequest(new { success = false, message = "Page and size must be positive numbers" });
                }

                IQueryable<BillPayment> query = _context.billPayments
                    .Include(b => b.Account);

                // Apply filters
                if (accountId.HasValue)
                {
                    query = query.Where(b => b.AccountId == accountId.Value);
                }

                if (!string.IsNullOrEmpty(biller))
                {
                    query = query.Where(b => b.Biller.Contains(biller));
                }

                if (dateFrom.HasValue)
                {
                    query = query.Where(b => b.PaymentDate >= dateFrom.Value);
                }

                if (dateTo.HasValue)
                {
                    query = query.Where(b => b.PaymentDate <= dateTo.Value);
                }

                // Count total items before pagination
                var totalItems = await query.CountAsync();

                // Apply pagination
                var billPayments = await query
                    .OrderByDescending(b => b.PaymentDate)
                    .Skip((page - 1) * size)
                    .Take(size)
                    .ToListAsync();

                // Return consistent response format
                return Ok(new
                {
                    items = billPayments.Select(b => new {
                        billId = b.BillId,
                        accountId = b.AccountId,
                        accountNumber = b.Account?.AccountNumber,
                        amount = b.Amount,
                        paymentDate = b.PaymentDate,
                        biller = b.Biller,
                        referenceNumber = b.ReferenceNumber
                    }),
                    totalItems = totalItems,
                    currentPage = page,
                    pageSize = size,
                    totalPages = (int)Math.Ceiling(totalItems / (double)size)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving bill payments",
                    error = ex.Message
                });
            }
        }

        // GET: api/BillPayments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BillPayment>> GetBillPayment(int id)
        {
            var billPayment = await _context.billPayments
                .Include(b => b.Account)
                .FirstOrDefaultAsync(b => b.BillId == id);

            if (billPayment == null)
            {
                return NotFound(new { success = false, message = "Bill payment not found" });
            }

            return Ok(new
            {
                success = true,
                billPayment = new
                {
                    billId = billPayment.BillId,
                    accountId = billPayment.AccountId,
                    accountNumber = billPayment.Account?.AccountNumber,
                    amount = billPayment.Amount,
                    paymentDate = billPayment.PaymentDate,
                    biller = billPayment.Biller,
                    referenceNumber = billPayment.ReferenceNumber
                }
            });
        }

        // POST: api/BillPayments
        [HttpPost]
        public async Task<IActionResult> CreateBillPayment([FromBody] BillPayment billPayment)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid bill payment data",
                        errors = ModelState.Values
                            .SelectMany(v => v.Errors)
                            .Select(e => e.ErrorMessage)
                    });
                }

                // Set payment date to now if not provided
                if (billPayment.PaymentDate == default)
                {
                    billPayment.PaymentDate = DateTime.Now;
                }

                // Get the associated account
                var account = await _context.accounts.FindAsync(billPayment.AccountId);
                if (account == null)
                {
                    return BadRequest(new { success = false, message = "Account not found" });
                }

                // Process the payment and update account balance
                billPayment.Account = account;
                billPayment.ProcessPayment();

                _context.billPayments.Add(billPayment);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Bill payment created successfully",
                    billId = billPayment.BillId,
                    newBalance = account.Balance
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while creating bill payment",
                    error = ex.Message
                });
            }
        }

        // PUT: api/BillPayments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBillPayment(int id, [FromBody] BillPayment billPayment)
        {
            if (id != billPayment.BillId)
            {
                return BadRequest(new { success = false, message = "Bill ID mismatch" });
            }

            // Get existing bill payment to preserve some properties
            var existingBillPayment = await _context.billPayments
                .Include(b => b.Account)
                .FirstOrDefaultAsync(b => b.BillId == id);

            if (existingBillPayment == null)
            {
                return NotFound(new { success = false, message = "Bill payment not found" });
            }

            // Get the account (existing or new)
            var account = await _context.accounts.FindAsync(billPayment.AccountId);
            if (account == null)
            {
                return BadRequest(new { success = false, message = "Account not found" });
            }

            try
            {
                // First, reverse the existing payment's effect
                existingBillPayment.Account.UpdateBalance(existingBillPayment.Amount);

                // Then apply the new payment
                billPayment.Account = account;
                billPayment.ProcessPayment();

                // Update the bill payment properties
                _context.Entry(existingBillPayment).CurrentValues.SetValues(billPayment);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Bill payment updated successfully",
                    newBalance = account.Balance
                });
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!BillPaymentExists(id))
                {
                    return NotFound(new { success = false, message = "Bill payment not found" });
                }
                return StatusCode(500, new
                {
                    success = false,
                    message = "Concurrency error occurred",
                    error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating bill payment",
                    error = ex.Message
                });
            }
        }

        // DELETE: api/BillPayments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBillPayment(int id)
        {
            try
            {
                var billPayment = await _context.billPayments
                    .Include(b => b.Account)
                    .FirstOrDefaultAsync(b => b.BillId == id);

                if (billPayment == null)
                {
                    return NotFound(new { success = false, message = "Bill payment not found" });
                }

                // Reverse the payment effect on the account balance
                billPayment.Account.UpdateBalance(billPayment.Amount);

                _context.billPayments.Remove(billPayment);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Bill payment deleted successfully",
                    billId = id,
                    newBalance = billPayment.Account.Balance
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting bill payment",
                    error = ex.Message
                });
            }
        }

        // GET: api/Accounts/5/BillPayments
        [HttpGet("~/api/Accounts/{accountId}/BillPayments")]
        public async Task<ActionResult<IEnumerable<BillPayment>>> GetAccountBillPayments(int accountId)
        {
            try
            {
                var account = await _context.accounts.FindAsync(accountId);
                if (account == null)
                {
                    return NotFound(new { success = false, message = "Account not found" });
                }

                var billPayments = await _context.billPayments
                    .Where(b => b.AccountId == accountId)
                    .OrderByDescending(b => b.PaymentDate)
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    items = billPayments.Select(b => new
                    {
                        billId = b.BillId,
                        accountId = b.AccountId,
                        amount = b.Amount,
                        paymentDate = b.PaymentDate,
                        biller = b.Biller,
                        referenceNumber = b.ReferenceNumber
                    }),
                    totalItems = billPayments.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving account bill payments",
                    error = ex.Message
                });
            }
        }

        private bool BillPaymentExists(int id)
        {
            return _context.billPayments.Any(e => e.BillId == id);
        }
    }
}
