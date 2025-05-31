import random
import json
import datetime
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

# Enhanced Personal Finance Manager
class PersonalFinanceManager:
    def __init__(self):
        self.transactions = {}
        self.transaction_counter = 1000
        self.accounts_summary = {}
        
    def generate_tid(self):
        """Generate unique transaction ID"""
        self.transaction_counter += 1
        return f"TXN{self.transaction_counter}"
    
    def calculate_account_balance(self, iban):
        """Calculate current balance for an IBAN"""
        if iban not in self.transactions:
            return 0.0
        
        balance = 0.0
        for transaction in self.transactions[iban]:
            if transaction['type'] == 'income':
                balance += transaction['amount']
            else:  # expense
                balance -= transaction['amount']
        return balance
    
    def add_income_transaction(self, iban, amount, date, description="", category='Salary'):
        """Add Income Transaction with improvements"""
        try:
            amount = float(amount)
            if amount <= 0:
                return {"status": "error", "message": "Amount must be positive"}
            
            tid = self.generate_tid()
            
            # Initialize IBAN if doesn't exist
            if iban not in self.transactions:
                self.transactions[iban] = []
            
            transaction = {
                'tid': tid,
                'iban': iban,
                'type': 'income',
                'amount': amount,
                'date': date,
                'description': description,
                'category': category,
                'timestamp': datetime.datetime.now().isoformat()
            }
            
            self.transactions[iban].append(transaction)
            new_balance = self.calculate_account_balance(iban)
            
            return {
                "status": "success", 
                "message": f"Income of ${amount:.2f} added successfully",
                "tid": tid,
                "new_balance": new_balance
            }
            
        except ValueError:
            return {"status": "error", "message": "Invalid amount format"}
        except Exception as e:
            return {"status": "error", "message": f"Error adding income: {str(e)}"}
    
    def add_expense_transaction(self, iban, amount, date, description="", category='Entertainment'):
        """Add Expense Transaction with improved budget constraints"""
        try:
            amount = float(amount)
            if amount <= 0:
                return {"status": "error", "message": "Amount must be positive"}
            
            # Enhanced budget constraint for Fun category
            if category == 'Fun':
                # Check single transaction limit
                if amount >= 5000:
                    return {
                        "status": "warning", 
                        "message": "WARNING: You are exceeding one-time budget constraint for Fun category ($5000)!"
                    }
                
                # Check monthly Fun spending
                current_month_fun_spending = self.get_monthly_category_spending(iban, category)
                if current_month_fun_spending + amount > 10000:  # Monthly limit
                    return {
                        "status": "warning",
                        "message": f"WARNING: Monthly Fun budget limit ($10,000) will be exceeded! Current spending: ${current_month_fun_spending:.2f}"
                    }
            
            # Check account balance
            current_balance = self.calculate_account_balance(iban)
            if current_balance < amount:
                return {
                    "status": "error", 
                    "message": f"Insufficient balance! Current balance: ${current_balance:.2f}, Required: ${amount:.2f}"
                }
            
            tid = self.generate_tid()
            
            # Initialize IBAN if doesn't exist
            if iban not in self.transactions:
                self.transactions[iban] = []
            
            transaction = {
                'tid': tid,
                'iban': iban,
                'type': 'expense',
                'amount': amount,
                'date': date,
                'description': description,
                'category': category,
                'timestamp': datetime.datetime.now().isoformat()
            }
            
            self.transactions[iban].append(transaction)
            new_balance = self.calculate_account_balance(iban)
            
            return {
                "status": "success",
                "message": f"Expense of ${amount:.2f} recorded successfully",
                "tid": tid,
                "new_balance": new_balance
            }
            
        except ValueError:
            return {"status": "error", "message": "Invalid amount format"}
        except Exception as e:
            return {"status": "error", "message": f"Error adding expense: {str(e)}"}
    
    def get_monthly_category_spending(self, iban, category):
        """Calculate monthly spending for a specific category"""
        if iban not in self.transactions:
            return 0.0
        
        current_month = datetime.datetime.now().strftime("%Y-%m")
        monthly_spending = 0.0
        
        for transaction in self.transactions[iban]:
            if (transaction['type'] == 'expense' and 
                transaction['category'] == category and 
                transaction['date'].startswith(current_month)):
                monthly_spending += transaction['amount']
        
        return monthly_spending
    
    def display_all_transactions(self):
        """Display all transactions in organized format"""
        if not self.transactions:
            return {"status": "info", "message": "No transactions found"}
        
        all_transactions = []
        for iban, trans_list in self.transactions.items():
            for transaction in trans_list:
                all_transactions.append(transaction)
        
        # Sort by timestamp (newest first)
        all_transactions.sort(key=lambda x: x['timestamp'], reverse=True)
        return {"status": "success", "transactions": all_transactions}
    
    def remove_transaction(self, iban, tid):
        """Remove transaction by IBAN and TID"""
        if iban not in self.transactions:
            return {"status": "error", "message": "IBAN not found in records"}
        
        for i, transaction in enumerate(self.transactions[iban]):
            if transaction['tid'] == tid:
                removed_transaction = self.transactions[iban].pop(i)
                
                # Remove IBAN entry if no transactions left
                if not self.transactions[iban]:
                    del self.transactions[iban]
                
                return {
                    "status": "success",
                    "message": f"Transaction {tid} removed successfully",
                    "removed_transaction": removed_transaction
                }
        
        return {"status": "error", "message": f"Transaction ID {tid} not found"}
    
    def search_by_date(self, date):
        """Enhanced search by date with better results"""
        results = []
        for iban, trans_list in self.transactions.items():
            for transaction in trans_list:
                if transaction['date'] == date:
                    results.append(transaction)
        
        if results:
            return {"status": "success", "results": results, "count": len(results)}
        else:
            return {"status": "info", "message": f"No transactions found for date: {date}"}
    
    def search_by_iban(self, iban):
        """Search transactions by IBAN"""
        if iban in self.transactions:
            return {
                "status": "success", 
                "results": self.transactions[iban],
                "count": len(self.transactions[iban]),
                "balance": self.calculate_account_balance(iban)
            }
        else:
            return {"status": "info", "message": f"No transactions found for IBAN: {iban}"}
    
    def search_by_category(self, category):
        """Search transactions by category"""
        results = []
        for iban, trans_list in self.transactions.items():
            for transaction in trans_list:
                if transaction['category'].lower() == category.lower():
                    results.append(transaction)
        
        if results:
            return {"status": "success", "results": results, "count": len(results)}
        else:
            return {"status": "info", "message": f"No transactions found for category: {category}"}
    
    def get_financial_summary(self):
        """Get comprehensive financial summary"""
        total_income = 0.0
        total_expenses = 0.0
        total_transactions = 0
        accounts_count = len(self.transactions)
        
        category_breakdown = {}
        
        for iban, trans_list in self.transactions.items():
            for transaction in trans_list:
                total_transactions += 1
                
                if transaction['type'] == 'income':
                    total_income += transaction['amount']
                else:
                    total_expenses += transaction['amount']
                
                # Category breakdown
                category = transaction['category']
                if category not in category_breakdown:
                    category_breakdown[category] = {'income': 0, 'expense': 0}
                category_breakdown[category][transaction['type']] += transaction['amount']
        
        return {
            "total_balance": total_income - total_expenses,
            "total_income": total_income,
            "total_expenses": total_expenses,
            "total_transactions": total_transactions,
            "accounts_count": accounts_count,
            "category_breakdown": category_breakdown
        }
    
    def export_data(self):
        """Export all data to JSON format"""
        return {
            "transactions": self.transactions,
            "summary": self.get_financial_summary(),
            "export_timestamp": datetime.datetime.now().isoformat()
        }
    
    def import_data(self, data):
        """Import data from JSON format"""
        try:
            if 'transactions' in data:
                self.transactions = data['transactions']
                return {"status": "success", "message": "Data imported successfully"}
        except Exception as e:
            return {"status": "error", "message": f"Error importing data: {str(e)}"}

# Flask Web Application
app = Flask(__name__)
CORS(app)

# Initialize Finance Manager
finance_manager = PersonalFinanceManager()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/add_income', methods=['POST'])
def add_income():
    data = request.json
    result = finance_manager.add_income_transaction(
        data['iban'],
        data['amount'],
        data['date'],
        data.get('description', ''),
        data.get('category', 'Salary')
    )
    return jsonify(result)

@app.route('/api/add_expense', methods=['POST'])
def add_expense():
    data = request.json
    result = finance_manager.add_expense_transaction(
        data['iban'],
        data['amount'],
        data['date'],
        data.get('description', ''),
        data.get('category', 'Entertainment')
    )
    return jsonify(result)

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    result = finance_manager.display_all_transactions()
    return jsonify(result)

@app.route('/api/remove_transaction', methods=['DELETE'])
def remove_transaction():
    data = request.json
    result = finance_manager.remove_transaction(data['iban'], data['tid'])
    return jsonify(result)

@app.route('/api/search/date/<date>', methods=['GET'])
def search_by_date(date):
    result = finance_manager.search_by_date(date)
    return jsonify(result)

@app.route('/api/search/iban/<iban>', methods=['GET'])
def search_by_iban(iban):
    result = finance_manager.search_by_iban(iban)
    return jsonify(result)

@app.route('/api/search/category/<category>', methods=['GET'])
def search_by_category(category):
    result = finance_manager.search_by_category(category)
    return jsonify(result)

@app.route('/api/summary', methods=['GET'])
def get_summary():
    result = finance_manager.get_financial_summary()
    return jsonify(result)

@app.route('/api/export', methods=['GET'])
def export_data():
    result = finance_manager.export_data()
    return jsonify(result)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    print("🚀 Personal Finance Manager Started!")
    if debug_mode:
        print("💰 Access your finance dashboard at: http://localhost:5000")
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port)