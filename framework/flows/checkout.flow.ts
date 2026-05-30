import { InventoryPage } from '@pages/InventoryPage';
import { CartPage } from '@pages/CartPage';
import { CheckoutPage } from '@pages/CheckoutPage';
import type { CheckoutCustomer } from '@types';

export class CheckoutFlow {
  constructor(
    private readonly inventoryPage: InventoryPage,
    private readonly cartPage: CartPage,
    private readonly checkoutPage: CheckoutPage,
  ) {}

  async completeOrder(customer: CheckoutCustomer) {
    await this.inventoryPage.addBackpackToCart();
    await this.inventoryPage.openCart();
    await this.cartPage.proceedToCheckout();
    await this.checkoutPage.fillShippingInfo(customer);
    await this.checkoutPage.continueCheckout();
    await this.checkoutPage.finishOrder();
  }
}
