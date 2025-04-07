using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BankingAPI.Models;

namespace BankingAPI.Data
{
    public class BankingContext : DbContext
    {
        public BankingContext(DbContextOptions<BankingContext> options)
            : base(options)
        {
        }

        public DbSet<Account> accounts { get; set; }
        public DbSet<Investment> investments { get; set; }
        public DbSet<Transaction> transactions { get; set; }
        public DbSet<CreditCard> creditCards { get; set; }
        public DbSet<Loan> loans { get; set; }
        public DbSet<BillPayment> billPayments { get; set; }
        public DbSet<SupportTicket> supportTickets { get; set; }
        public DbSet<PersonalFinanceTool> personalFinance { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

        }
    }
}