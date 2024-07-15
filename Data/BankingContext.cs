using BankingAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace BankingAPI.Data
{
    public class BankingContext : DbContext
    {
        public BankingContext(DbContextOptions<BankingContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Beneficiary> Beneficiaries { get; set; }
        public DbSet<BillPayment> BillPayments { get; set; }
        public DbSet<CreditCard> CreditCards { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder) 
        {
            modelBuilder.Entity<Account>().ToTable("account");
            modelBuilder.Entity<Transaction>().ToTable("transaction");
        }
    }
}
