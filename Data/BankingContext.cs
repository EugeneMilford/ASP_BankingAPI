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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Account>().ToTable("account");
            modelBuilder.Entity<Transaction>().ToTable("transaction");
            modelBuilder.Entity<User>().ToTable("users");

            // Seed Users
            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Username = "johndoe", PasswordHash = "hpassword1", FirstName = "John", LastName = "Doe", Email = "john@example.com" },
                new User { Id = 2, Username = "janesmith", PasswordHash = "hpassword2", FirstName = "Jane", LastName = "Smith", Email = "jane@example.com" }
            );

            base.OnModelCreating(modelBuilder);
        }
    }
}