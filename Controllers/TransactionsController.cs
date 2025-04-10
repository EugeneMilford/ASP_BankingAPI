using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BankingAPI.Data;
using BankingAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionsController : ControllerBase
    {
        private readonly BankingContext _context;

        public TransactionsController(BankingContext context)
        {
            _context = context;
        }

        // GET: api/Transactions with filtering and pagination
        [HttpGet]
        public async Task<ActionResult> GetTransactions(
            [FromQuery] int? accountId = null,
            [FromQuery] string? type = null,
            [FromQuery] DateTime? dateFrom = null,
            [FromQuery] DateTime? dateTo = null,
            [FromQuery] int page = 1,
            [FromQuery] int size = 10)
        {
            try
            {
                if (page < 1 || size < 1)
                {
                    return BadRequest("Page and size must be positive numbers");
                }

                IQueryable<Transaction> query = _context.transactions
                    .Include(t => t.Account);

                // Apply filters
                if (accountId.HasValue)
                {
                    query = query.Where(t => t.AccountId == accountId.Value);
                }

                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(t => t.Type == type);
                }

                if (dateFrom.HasValue)
                {
                    query = query.Where(t => t.Date >= dateFrom.Value);
                }

                if (dateTo.HasValue)
                {
                    query = query.Where(t => t.Date <= dateTo.Value);
                }

                // Count total items before pagination
                var totalItems = await query.CountAsync();

                // Apply pagination
                var transactions = await query
                    .OrderByDescending(t => t.Date)
                    .Skip((page - 1) * size)
                    .Take(size)
                    .ToListAsync();

                // Return consistent response format
                return Ok(new
                {
                    items = transactions.Select(t => new {
                        transactionId = t.TransactionId,
                        accountId = t.AccountId,
                        accountNumber = t.Account?.AccountNumber,
                        amount = t.Amount,
                        date = t.Date,
                        type = t.Type,
                        description = t.Description
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
                    message = "An error occurred while retrieving transactions",
                    error = ex.Message
                });
            }
        }

        // GET: api/Transactions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Transaction>> GetTransaction(int id)
        {
            var transaction = await _context.transactions
                .Include(t => t.Account)
                .FirstOrDefaultAsync(t => t.TransactionId == id);

            if (transaction == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Transaction not found"
                });
            }

            return Ok(new
            {
                success = true,
                transaction = new
                {
                    transactionId = transaction.TransactionId,
                    accountId = transaction.AccountId,
                    accountNumber = transaction.Account?.AccountNumber,
                    amount = transaction.Amount,
                    date = transaction.Date,
                    type = transaction.Type,
                    description = transaction.Description
                }
            });
        }

        // POST: api/Transactions
        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromBody] Transaction transaction)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid transaction data",
                        errors = ModelState.Values
                            .SelectMany(v => v.Errors)
                            .Select(e => e.ErrorMessage)
                    });
                }

                // Set transaction date to now if not provided
                if (transaction.Date == default)
                {
                    transaction.Date = DateTime.Now;
                }

                // Get the associated account
                var account = await _context.accounts.FindAsync(transaction.AccountId);
                if (account == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Account not found"
                    });
                }

                // Process the transaction and update account balance
                transaction.Account = account;
                transaction.ProcessTransaction();

                _context.transactions.Add(transaction);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Transaction created successfully",
                    transactionId = transaction.TransactionId,
                    newBalance = account.Balance
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while creating transaction",
                    error = ex.Message
                });
            }
        }

        // PUT: api/Transactions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTransaction(int id, [FromBody] Transaction transaction)
        {
            if (id != transaction.TransactionId)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Transaction ID mismatch"
                });
            }

            // Get existing transaction to preserve some properties
            var existingTransaction = await _context.transactions
                .Include(t => t.Account)
                .FirstOrDefaultAsync(t => t.TransactionId == id);

            if (existingTransaction == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Transaction not found"
                });
            }

            // Get the account (existing or new)
            var account = await _context.accounts.FindAsync(transaction.AccountId);
            if (account == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Account not found"
                });
            }

            try
            {
                // First, reverse the existing transaction's effect
                existingTransaction.Type = existingTransaction.Type == "Credit" ? "Debit" : "Credit";
                existingTransaction.ProcessTransaction();

                // Then apply the new transaction
                transaction.Account = account;
                transaction.ProcessTransaction();

                // Update the transaction properties
                _context.Entry(existingTransaction).CurrentValues.SetValues(transaction);
                existingTransaction.Type = transaction.Type; // Ensure type is updated correctly

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Transaction updated successfully",
                    newBalance = account.Balance
                });
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!TransactionExists(id))
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Transaction not found"
                    });
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
                    message = "An error occurred while updating transaction",
                    error = ex.Message
                });
            }
        }

        // DELETE: api/Transactions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransaction(int id)
        {
            try
            {
                var transaction = await _context.transactions
                    .Include(t => t.Account)
                    .FirstOrDefaultAsync(t => t.TransactionId == id);

                if (transaction == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Transaction not found"
                    });
                }

                // Reverse the transaction effect on the account balance
                transaction.Type = transaction.Type == "Credit" ? "Debit" : "Credit";
                transaction.ProcessTransaction();

                _context.transactions.Remove(transaction);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Transaction deleted successfully",
                    transactionId = id,
                    newBalance = transaction.Account.Balance
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting transaction",
                    error = ex.Message
                });
            }
        }

        // GET: api/Accounts/5/Transactions
        [HttpGet("~/api/Accounts/{accountId}/Transactions")]
        public async Task<ActionResult<IEnumerable<Transaction>>> GetAccountTransactions(int accountId)
        {
            try
            {
                var account = await _context.accounts.FindAsync(accountId);
                if (account == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Account not found"
                    });
                }

                var transactions = await _context.transactions
                    .Where(t => t.AccountId == accountId)
                    .OrderByDescending(t => t.Date)
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    items = transactions.Select(t => new
                    {
                        transactionId = t.TransactionId,
                        accountId = t.AccountId,
                        amount = t.Amount,
                        date = t.Date,
                        type = t.Type,
                        description = t.Description
                    }),
                    totalItems = transactions.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving account transactions",
                    error = ex.Message
                });
            }
        }

        private bool TransactionExists(int id)
        {
            return _context.transactions.Any(e => e.TransactionId == id);
        }
    }
}