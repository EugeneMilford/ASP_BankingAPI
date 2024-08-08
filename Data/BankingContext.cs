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

        public DbSet<Account> Accounts { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Transaction> Transaction { get; set; }
        public DbSet<CreditCard> CreditCard { get; set; }
        public DbSet<BillPayment> BillPayments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Account>().ToTable("account");
            modelBuilder.Entity<Transaction>().ToTable("transaction");
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<CreditCard>().ToTable("credit");
            modelBuilder.Entity<BillPayment>().ToTable("bills");

            // Configure foreign key for Transaction
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Account)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AccountId);

            // Seed Users
            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Username = "johndoe", PasswordHash = "hpassword1", FirstName = "John", LastName = "Doe", Email = "john@example.com" },
                new User { Id = 2, Username = "janesmith", PasswordHash = "hpassword2", FirstName = "Jane", LastName = "Smith", Email = "jane@example.com" }
            );

            base.OnModelCreating(modelBuilder);
        }
    }
}