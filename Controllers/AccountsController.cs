using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BankingAPI.Data;
using BankingAPI.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BankingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly BankingContext _context;

        public AccountsController(BankingContext context)
        {
            _context = context;
        }

        // GET: api/Accounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Account>>> GetAccounts()
        {
            return await _context.accounts.ToListAsync();
        }

        // GET: api/Accounts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Account>> GetAccount(int id)
        {
            var account = await _context.accounts.FindAsync(id);
            if (account == null)
            {
                return NotFound(new { success = false, message = "Account not found" });
            }
            return Ok(account);
        }

        // POST: api/Accounts
        [HttpPost]
        public async Task<ActionResult<Account>> CreateAccount([FromBody] Account account)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Invalid account data" });
            }
            _context.accounts.Add(account);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAccount), new { id = account.Id }, account);
        }

        // PUT: api/Accounts/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAccount(int id, [FromBody] Account account)
        {
            if (id != account.Id)
            {
                return BadRequest(new { success = false, message = "Account ID mismatch" });
            }

            _context.Entry(account).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AccountExists(id))
                {
                    return NotFound(new { success = false, message = "Account not found" });
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Accounts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccount(int id)
        {
            var account = await _context.accounts.FindAsync(id);
            if (account == null)
            {
                return NotFound(new { success = false, message = "Account not found" });
            }

            _context.accounts.Remove(account);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool AccountExists(int id)
        {
            return _context.accounts.Any(e => e.Id == id);
        }
    }
}