import argparse

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    load_dotenv = None

if load_dotenv:
    load_dotenv()

DEFAULT_ACTIVE_COMPANY_STATUS = "1"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch company data from SCB and update the local database.",
    )
    parser.add_argument(
        "--registration-status",
        default="1",
        help="SCB Registreringsstatus code. Defaults to 1.",
    )
    parser.add_argument(
        "--company-status",
        action="append",
        default=None,
        help=(
            "SCB Företagsstatus code to import. Can be passed multiple times. "
            "Defaults to 1."
        ),
    )
    parser.add_argument(
        "--include-inactive",
        action="store_true",
        help="Import all Företagsstatus codes except the active/default code 1.",
    )
    parser.add_argument(
        "--include-active",
        action="store_true",
        help="When using --include-inactive, also import active/default company status 1.",
    )
    return parser.parse_args()


def get_company_statuses(client, include_inactive: bool, include_active: bool) -> list[str]:
    if not include_inactive:
        return []

    from worker.scb.models.category import Category

    codes, _ = client.get_category_codes(Category.COMPANY_STATUS)
    statuses = [
        code
        for code in codes
        if include_active or code != DEFAULT_ACTIVE_COMPANY_STATUS
    ]

    if not statuses:
        raise RuntimeError("No company status codes found for inactive import.")

    return statuses


def main() -> None:
    args = parse_args()

    from worker.scb.scb_custom_client import SCBCustomClient

    client = SCBCustomClient()
    statuses = args.company_status or (
        [DEFAULT_ACTIVE_COMPANY_STATUS]
        if not args.include_inactive or args.include_active
        else []
    )
    statuses.extend(
        get_company_statuses(
            client,
            include_inactive=args.include_inactive,
            include_active=args.include_active,
        )
    )
    statuses = list(dict.fromkeys(statuses))

    for company_status in statuses:
        print(
            "Running SCB update "
            f"registration_status={args.registration_status} "
            f"company_status={company_status}"
        )
        client.seed_all_companies(
            reg_status=args.registration_status,
            co_status=company_status,
        )


if __name__ == "__main__":
    main()
