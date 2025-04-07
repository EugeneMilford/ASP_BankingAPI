using System;
using System.ComponentModel.DataAnnotations;

namespace BankingAPI.Models
{
    public class Transaction
    {
        [Key]
        public int TransactionId { get; set; }

        [Required]
        public int AccountId { get; set; }  // Link to Account
        public Account Account { get; set; }  // Navigation property to Account

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public string Type { get; set; } 
        public string Description { get; set; }

        // Method to process the transaction and update account balance
        public void ProcessTransaction()
        {
            if (Type == "Debit")
            {
                Account.UpdateBalance(-Amount);  // Deduct from account
            }
            else if (Type == "Credit")
            {
                Account.UpdateBalance(Amount);   // Add to account
            }
        }
    }
}
