using System;
using System.Collections.Generic;

namespace BankingAPI.Models
{
    public class Account
    {
        public int Id { get; set; }
        public string AccountNumber { get; set; }
        public decimal Balance { get; set; }
        public string AccountType { get; set; }
        public DateTime CreatedDate { get; set; }

        public virtual ICollection<Transaction> Transactions { get; set; }

        public virtual ICollection<BillPayment> BillPayments { get; set; }

        public virtual ICollection<CreditCard> CreditCards { get; set; }
        public virtual ICollection<Loan> Loans { get; set; }
        public virtual ICollection<Investment> Investments { get; set; }

        // Constructor
        public Account()
        {
            Transactions = new List<Transaction>();
            BillPayments = new List<BillPayment>();
            CreditCards = new List<CreditCard>();
            Loans = new List<Loan>();
            Investments = new List<Investment>();
        }

        // Method to update balance after a transaction or bill payment
        public void UpdateBalance(decimal amount)
        {
            Balance += amount;
        }
    }
}


