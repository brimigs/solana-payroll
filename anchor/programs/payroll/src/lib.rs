#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("9DJSeCNdizRRHCNA9gnFtfrkhAZW3A921rThY4Eqi6Zs");

#[program]
pub mod payroll {

    use super::*;

    pub fn initialize_payroll(ctx: Context<InitializeSolanaPayroll>, title: String) -> Result<()> {
        let payroll = &mut ctx.accounts.solana_payroll;
        payroll.id_counter = 0;
        payroll.title = title;
        payroll.employees = vec![];
        payroll.admin = ctx.accounts.admin.key();
        Ok(())
    }

    pub fn add_employee(
        ctx: Context<AddEmployee>,
        salary: u64,
        name: String,
    ) -> Result<()> {
        let payroll = &mut ctx.accounts.solana_payroll;
        let employee = &mut ctx.accounts.employee;

        // Ensure that the admin is removing the employee
        if payroll.admin != ctx.accounts.admin.key() {
            return Err(ProgramError::IllegalOwner.into());
        }

        payroll.id_counter += 1;
        let employee_id = payroll.id_counter;

        employee.employee_id = employee_id;
        employee.salary = salary;
        employee.name = name;

        // payroll.employees.push(pubkey);

        Ok(())
    }

    pub fn update_salary(
        ctx: Context<UpdateSalary>,
        _name: String,
        new_salary: u64,
    ) -> Result<()> {
        let payroll = &mut ctx.accounts.solana_payroll;
        let employee = &mut ctx.accounts.employee;

        // Ensure that the admin is removing the employee
        if payroll.admin != ctx.accounts.admin.key() {
            return Err(ProgramError::IllegalOwner.into());
        }

        employee.salary = new_salary;

        Ok(())
    }

    pub fn close_payroll_account(ctx: Context<CloseSolanaPayroll>, _title: String) -> Result<()> {
        let payroll = &mut ctx.accounts.solana_payroll;
        if payroll.admin != ctx.accounts.admin.key() {
            return Err(ProgramError::IllegalOwner.into());
        }
        Ok(())
    }

    pub fn remove_employee(
        ctx: Context<RemoveEmployee>,
        _name: String,
    ) -> Result<()> {
        let payroll = &mut ctx.accounts.solana_payroll;
        let employee = &mut ctx.accounts.employee;

        let pubkey = employee.pubkey;

        if payroll.admin != ctx.accounts.admin.key() {
            return Err(ProgramError::IllegalOwner.into());
        }

        let mut i = 0;
        while i < payroll.employees.len() {
            if payroll.employees[i] == pubkey {
                payroll.employees.remove(i);
            } else {
                i += 1;
            }
        }

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct InitializeSolanaPayroll<'info> {
    #[account(
      init,
      seeds = [title.as_bytes(), admin.key().as_ref()],
      bump,
      space = 8 + 1000,
      payer = admin
    )]
    pub solana_payroll: Account<'info, PayrollState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(salary: u64, name: String,)]
pub struct AddEmployee<'info> {
    #[account(
        init,
        seeds = [name.as_bytes(), &solana_payroll.id_counter.to_le_bytes()],
        bump,
        space = 8 + 1000,
        payer = admin
      )]
    pub employee: Account<'info, Employee>,
    #[account(mut)]
    pub solana_payroll: Account<'info, PayrollState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CloseSolanaPayroll<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
      mut,
      seeds = [title.as_bytes(), admin.key().as_ref()], 
      bump, 
      close = admin, 
    )]
    pub solana_payroll: Account<'info, PayrollState>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RemoveEmployee<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
      mut,
      seeds = [name.as_bytes(), &employee.employee_id.to_le_bytes()],
      bump, 
      close = admin, 
    )]
    pub employee: Account<'info, Employee>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub solana_payroll: Account<'info, PayrollState>,
}

#[derive(Accounts)]
#[instruction(name: String, new_salary: u64,)]
pub struct UpdateSalary<'info> {
    #[account(
      mut,
      seeds = [name.as_bytes(), &employee.employee_id.to_le_bytes()],
      bump, 
    )]
    pub employee: Account<'info, Employee>,
    #[account(mut)]
    pub solana_payroll: Account<'info, PayrollState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Employee {
    employee_id: u32,
    salary: u64,
    name: String,
    pubkey: Pubkey,
}

#[account]
pub struct PayrollState {
    id_counter: u32,
    admin: Pubkey,
    title: String,
    employees: Vec<Pubkey>,
}
