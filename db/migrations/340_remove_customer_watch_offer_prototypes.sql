-- Remove the early CRM/watch prototypes. Saved segments remain product-owned;
-- future monitoring and workflow concepts will receive new, explicit models.
DROP TABLE IF EXISTS app.sales_offer_customer;
DROP TABLE IF EXISTS app.customer_account;
DROP TABLE IF EXISTS app.sales_offer;
DROP TABLE IF EXISTS app.watched_company;

DROP FUNCTION IF EXISTS app.check_link_owner();
