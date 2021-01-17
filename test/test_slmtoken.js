const SlmToken = artifacts.require("SlmToken");

const {
  initialSupply,
  toSlm,
  shouldRevert,
  assertBalance,
} = require('./util.js')(web3);

contract('SlmToken', (accounts) => {
  it('is initialized with 100,000,000 supply', async () => {
    const token = await SlmToken.deployed();

    const total = await token.totalSupply();

    await assertBalance(token, accounts[0], initialSupply, 'Initial owner balance incorrect');
    assert.equal(total.toString(), initialSupply.toString(), 'Total supply incorrect');
  });

  it('should start in the locked state', async () => {
    const token = await SlmToken.deployed();

    const account1 = accounts[0];
    const account2 = accounts[1];

    // Can't transfer when locked
    const amount = toSlm(1000);
    await shouldRevert(
      token.transfer(account2, amount, { from: account1 }),
      'The contract should be locked',
    );
    await shouldRevert(
      token.approve(account2, amount, { from: account1 }),
      'The contract should be locked',      
    );
    await shouldRevert(
      token.transferFrom(account1, account2, amount, { from: account1 }),
      'The contract should be locked',
    );
    await shouldRevert(
      token.increaseAllowance(account2, amount, { from: account1 }),
      'The contract should be locked',      
    );
    await shouldRevert(
      token.decreaseAllowance(account2, amount, { from: account1 }),
      'The contract should be locked',      
    );

    // Check balances of first and second account after the transactions.
    await assertBalance(token, account1, initialSupply, 'Incorrect sender token balance');
    await assertBalance(token, account2, 0, 'Incorrect receiver token balance');
  });

  it('should be unlockable', async () => {
    const token = await SlmToken.deployed();

    const account1 = accounts[0];
    const account2 = accounts[1];

    // Token starts off locked
    let locked = await token.locked();
    assert(locked, 'Token must start off locked');

    await shouldRevert(
      token.unlock({ from: account2 }),
      'Non-owner cannot unlock',
    );

    // Owner can unlock
    await token.unlock({ from : account1 });
    locked = await token.locked();
    assert(!locked, 'Token should be unlocked by owner');
  });

  it('should allow transfers when unlocked', async () => {
    const token = await SlmToken.deployed();

    const account1 = accounts[0];
    const account2 = accounts[1];
  
    let account1Balance = initialSupply;
    const amount = toSlm(1000);

    // Can transfeer
    await token.transfer(account2, amount, { from: account1 });

    account1Balance = account1Balance.sub(amount);
    let account2Balance = amount;
    assertBalance(token, account1, account1Balance, 'Incorrect sender balance');
    assertBalance(token, account2, account2Balance, 'Incorrect receiver balance');

    // Can approve/transferFrom/increaseAllowance/decreaseAllowance
    const amount2 = amount.mul(web3.utils.toBN('2'));
    await token.approve(account2, amount, { from: account1 });
    await token.increaseAllowance(account2, amount2, { from: account1 });
    await token.decreaseAllowance(account2, amount2, { from: account1 });
    await token.transferFrom(account1, account2, amount, { from: account2 });

    account1Balance = account1Balance.sub(amount);
    account2Balance = account2Balance.add(amount);
    assertBalance(token, account1, account1Balance, 'Incorrect sender balance');
    assertBalance(token, account2, account2Balance, 'Incorrect receiver balance');
  });

  it('should allow transfers while locked to addresses with exceptions', async () => {
    const token = await SlmToken.deployed();

    const [_account1, account2, account3, ..._] = accounts;
  
    // Set an exception for account2
    const amount = toSlm(2000);
    await token.lock();
    await shouldRevert(
      token.transfer(account3, amount, { from: account2 }),
      'The contract should be locked',
    );
    await token.setTradeException(account2, true);

    // Can transfer from account2 but not account3
    await token.transfer(account3, amount, { from: account2 });
    assertBalance(token, account3, amount, 'Incorrect receiver balance');

    
    await shouldRevert(
      token.transfer(account2, amount, { from: account3 }),
      'Account3 does not have an exception',
    );

    // Can no longer transfer after removing trade exception
    await token.setTradeException(account2, false);
    await shouldRevert(
      token.transfer(account3, amount, { from: account2 }),
      'Account2 no longer has an exception',
    );
  });

  it('can burn tokens and burn approved tokens', async () => {
    const token = await SlmToken.deployed();
    await token.unlock();

    const [account1, account2, ..._] = accounts;

    // Burn tokens
    const amount = toSlm(1000);
    let expectBalance = (await token.balanceOf(account1)).sub(amount);
    let expectSupply = (await token.totalSupply()).sub(amount);
    await token.burn(amount, { from: account1 });

    // Burned tokens are removed from supply
    assertBalance(token, account1, expectBalance, 'Burned tokens not removed from wallet');
    const supply1 = (await token.totalSupply()).toString();
    assert.equal(expectSupply.toString(), supply1, 'Burned tokens not removed from supply');

    // Burn token allowance
    expectBalance = expectBalance.sub(amount);
    expectSupply = expectSupply.sub(amount);
    await token.approve(account2, amount, { from: account1 });
    await token.burnFrom(account1, amount, { from: account2 });
    assertBalance(token, account1, expectBalance, 'BurnedFrom tokens not removed from wallet');
    const supply2 = (await token.totalSupply()).toString();
    assert.equal(expectSupply.toString(), supply2, 'BurnedFrom tokens not removed from supply');
  });

  it('can be minted by the owner', async () => {
    const token = await SlmToken.deployed();

    const [account1, account2, ..._] = accounts;

    // Owner can mint tokens
    const amount = toSlm(1000000);
    let expectBalance = (await token.balanceOf(account2)).add(amount);
    let expectSupply = (await token.totalSupply()).add(amount);
    await token.mint(account2, amount);
    assertBalance(token, account2, expectBalance, 'Minted tokens not sent to account2');
    const supply = (await token.totalSupply()).toString();
    assert.equal(supply, expectSupply.toString(), 'Minted tokens not added to supply');

    // Non-owner cannot mint
    shouldRevert(token.mint(account2, amount, { from: account2 }), 'Non-owner cannot mint');
  });

  it('should not allow arbitrary access', async () => {
    const token = await SlmToken.deployed();

    const [account1, account2, ..._] = accounts;
    const amount = toSlm(1000000);

    // Virtual mint function not callable
    try {
      await token._mint(account2, amount, { from: account1 });
    } catch(e) {
      assert.equal(e.message, 'token._mint is not a function');
    }

    // Non-owner cannot set trade exceptions
    shouldRevert(
      token.setTradeException(account2, true, { from: account2 }),
      'Non-creator cannot set trade exception',
    );
  });
});
