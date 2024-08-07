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
    }
}
