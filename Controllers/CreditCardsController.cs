using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BankingAPI.Data;
using BankingAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CreditCardsController : ControllerBase
    {
        private readonly BankingContext _context;

        public CreditCardsController(BankingContext context)
        {
            _context = context;
        }

        // GET: api/CreditCards
        [HttpGet]
        public async Task<ActionResult> GetCreditCards(
            [FromQuery] int? accountId = null,
            [FromQuery] string? cardType = null,
            [FromQuery] int page = 1,
            [FromQuery] int size = 10)
        {
            try
            {
                if (page < 1 || size < 1)
                {
                    return BadRequest(new { success = false, message = "Page and size must be positive numbers" });
                }

                IQueryable<CreditCard> query = _context.creditCards
                    .Include(c => c.Account);

                // Apply filters
                if (accountId.HasValue)
                {
                    query = query.Where(c => c.AccountId == accountId.Value);
                }

                if (!string.IsNullOrEmpty(cardType))
                {
                    query = query.Where(c => c.CardType == cardType);
                }

                // Count total items before pagination
                var totalItems = await query.CountAsync();

                // Apply pagination
                var creditCards = await query
                    .OrderBy(c => c.ExpiryDate)
                    .Skip((page - 1) * size)
                    .Take(size)
                    .ToListAsync();

                // Return consistent response format
                return Ok(new
                {
                    items = creditCards.Select(c => new {
                        creditId = c.CreditId,
                        cardNumber = MaskCardNumber(c.CardNumber),
                        creditLimit = c.CreditLimit,
                        currentBalance = c.CurrentBalance,
                        availableCredit = c.CreditLimit - c.CurrentBalance,
                        accountId = c.AccountId,
                        accountNumber = c.Account?.AccountNumber,
                        expiryDate = c.ExpiryDate,
                        cardType = c.CardType
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
                    message = "An error occurred while retrieving credit cards",
                    error = ex.Message
                });
            }
        }

        // GET: api/CreditCards/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CreditCard>> GetCreditCard(int id)
        {
            var creditCard = await _context.creditCards
                .Include(c => c.Account)
                .FirstOrDefaultAsync(c => c.CreditId == id);

            if (creditCard == null)
            {
                return NotFound(new { success = false, message = "Credit card not found" });
            }

            return Ok(new
            {
                success = true,
                creditCard = new
                {
                    creditId = creditCard.CreditId,
                    cardNumber = MaskCardNumber(creditCard.CardNumber),
                    creditLimit = creditCard.CreditLimit,
                    currentBalance = creditCard.CurrentBalance,
                    availableCredit = creditCard.CreditLimit - creditCard.CurrentBalance,
                    accountId = creditCard.AccountId,
                    accountNumber = creditCard.Account?.AccountNumber,
                    expiryDate = creditCard.ExpiryDate,
                    cardType = creditCard.CardType
                }
            });
        }

        // POST: api/CreditCards
        [HttpPost]
        public async Task<IActionResult> CreateCreditCard([FromBody] CreditCard creditCard)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid credit card data",
                        errors = ModelState.Values
                            .SelectMany(v => v.Errors)
                            .Select(e => e.ErrorMessage)
                    });
                }

                // Get the associated account
                var account = await _context.accounts.FindAsync(creditCard.AccountId);
                if (account == null)
                {
                    return BadRequest(new { success = false, message = "Account not found" });
                }

                // Set default values if not provided
                if (creditCard.CurrentBalance == 0)
                {
                    creditCard.CurrentBalance = 0;
                }

                if (string.IsNullOrEmpty(creditCard.CardType))
                {
                    creditCard.CardType = "Visa"; // Default card type
                }

                _context.creditCards.Add(creditCard);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Credit card created successfully",
                    creditId = creditCard.CreditId,
                    accountBalance = account.Balance
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while creating credit card",
                    error = ex.Message
                });
            }
        }

        // PUT: api/CreditCards/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCreditCard(int id, [FromBody] CreditCard creditCard)
        {
            if (id != creditCard.CreditId)
            {
                return BadRequest(new { success = false, message = "Credit card ID mismatch" });
            }

            // Get existing credit card
            var existingCard = await _context.creditCards
                .Include(c => c.Account)
                .FirstOrDefaultAsync(c => c.CreditId == id);

            if (existingCard == null)
            {
                return NotFound(new { success = false, message = "Credit card not found" });
            }

            try
            {
                // Update properties
                existingCard.CardNumber = creditCard.CardNumber;
                existingCard.CreditLimit = creditCard.CreditLimit;
                existingCard.ExpiryDate = creditCard.ExpiryDate;
                existingCard.CardType = creditCard.CardType;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Credit card updated successfully"
                });
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!CreditCardExists(id))
                {
                    return NotFound(new { success = false, message = "Credit card not found" });
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
                    message = "An error occurred while updating credit card",
                    error = ex.Message
                });
            }
        }

        // DELETE: api/CreditCards/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCreditCard(int id)
        {
            try
            {
                var creditCard = await _context.creditCards
                    .Include(c => c.Account)
                    .FirstOrDefaultAsync(c => c.CreditId == id);

                if (creditCard == null)
                {
                    return NotFound(new { success = false, message = "Credit card not found" });
                }

                _context.creditCards.Remove(creditCard);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Credit card deleted successfully",
                    creditId = id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting credit card",
                    error = ex.Message
                });
            }
        }

        // POST: api/CreditCards/5/Charge
        [HttpPost("{id}/Charge")]
        public async Task<IActionResult> ProcessCharge(int id, [FromBody] ChargeRequest request)
        {
            try
            {
                var creditCard = await _context.creditCards
                    .Include(c => c.Account)
                    .FirstOrDefaultAsync(c => c.CreditId == id);

                if (creditCard == null)
                {
                    return NotFound(new { success = false, message = "Credit card not found" });
                }

                creditCard.ProcessCharge(request.Amount);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Charge processed successfully",
                    newBalance = creditCard.CurrentBalance,
                    availableCredit = creditCard.CreditLimit - creditCard.CurrentBalance
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while processing charge",
                    error = ex.Message
                });
            }
        }

        // POST: api/CreditCards/5/Payment
        [HttpPost("{id}/Payment")]
        public async Task<IActionResult> ProcessPayment(int id, [FromBody] PaymentRequest request)
        {
            try
            {
                var creditCard = await _context.creditCards
                    .Include(c => c.Account)
                    .FirstOrDefaultAsync(c => c.CreditId == id);

                if (creditCard == null)
                {
                    return NotFound(new { success = false, message = "Credit card not found" });
                }

                creditCard.ProcessPayment(request.Amount);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Payment processed successfully",
                    newBalance = creditCard.CurrentBalance,
                    availableCredit = creditCard.CreditLimit - creditCard.CurrentBalance,
                    accountBalance = creditCard.Account.Balance
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while processing payment",
                    error = ex.Message
                });
            }
        }

        // GET: api/Accounts/5/CreditCards
        [HttpGet("~/api/Accounts/{accountId}/CreditCards")]
        public async Task<ActionResult<IEnumerable<CreditCard>>> GetAccountCreditCards(int accountId)
        {
            try
            {
                var account = await _context.accounts.FindAsync(accountId);
                if (account == null)
                {
                    return NotFound(new { success = false, message = "Account not found" });
                }

                var creditCards = await _context.creditCards
                    .Where(c => c.AccountId == accountId)
                    .OrderBy(c => c.ExpiryDate)
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    items = creditCards.Select(c => new
                    {
                        creditId = c.CreditId,
                        cardNumber = MaskCardNumber(c.CardNumber),
                        creditLimit = c.CreditLimit,
                        currentBalance = c.CurrentBalance,
                        availableCredit = c.CreditLimit - c.CurrentBalance,
                        expiryDate = c.ExpiryDate,
                        cardType = c.CardType
                    }),
                    totalItems = creditCards.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving account credit cards",
                    error = ex.Message
                });
            }
        }

        private bool CreditCardExists(int id)
        {
            return _context.creditCards.Any(e => e.CreditId == id);
        }

        private static string MaskCardNumber(string cardNumber)
        {
            if (string.IsNullOrEmpty(cardNumber) || cardNumber.Length < 4)
                return "****";

            return new string('*', cardNumber.Length - 4) + cardNumber.Substring(cardNumber.Length - 4);
        }
    }

    public class ChargeRequest
    {
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }
    }

    public class PaymentRequest
    {
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }
    }
}
