/* eslint-disable react/no-unstable-nested-components */
import { Button, Flex } from "@fidesui/react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useFeatures } from "common/features";
import {
  BadgeCell,
  DefaultCell,
  DefaultHeaderCell,
  FidesTableV2,
  GlobalFilterV2,
  PaginationBar,
  TableActionBar,
  TableSkeletonLoader,
  useServerSidePagination,
} from "common/table/v2";
import { useEffect, useMemo, useState } from "react";

import {
  ConsentManagementFilterModal,
  Option,
  useConsentManagementFilters,
} from "~/features/configure-consent/ConsentManagementFilterModal";
import {
  ConsentManagementModal,
  useConsentManagementModal,
} from "~/features/configure-consent/ConsentManagementModal";
import {
  useGetHealthQuery,
  useGetVendorReportQuery,
} from "~/features/plus/plus.slice";
import { Page_SystemSummary_, SystemSummary } from "~/types/api";

const columnHelper = createColumnHelper<SystemSummary>();

const emptyVendorReportResponse: Page_SystemSummary_ = {
  items: [],
  total: 0,
  page: 1,
  size: 25,
  pages: 1,
};
export const ConsentManagementTable = () => {
  const { tcf: isTcfEnabled } = useFeatures();
  const { isLoading: isLoadingHealthCheck } = useGetHealthQuery();
  const {
    isOpen: isRowModalOpen,
    onOpen: onRowModalOpen,
    onClose: onRowModalClose,
  } = useConsentManagementModal();
  const [systemFidesKey, setSystemFidesKey] = useState<string>();

  const {
    isOpen: isFilterOpen,
    onOpen: onOpenFilter,
    onClose: onCloseFilter,
    resetFilters,
    purposeOptions,
    onPurposeChange,
    dataUseOptions,
    onDataUseChange,
    legalBasisOptions,
    onLegalBasisChange,
    consentCategoryOptions,
    onConsentCategoryChange,
  } = useConsentManagementFilters();

  const getQueryParamsFromList = (optionList: Option[], queryParam: string) => {
    const checkedOptions = optionList.filter((option) => option.isChecked);
    return checkedOptions.length > 0
      ? `${queryParam}=${checkedOptions
          .map((option) => option.value)
          .join(`&${queryParam}=`)}`
      : undefined;
  };
  const selectedDataUseFilters = useMemo(
    () => getQueryParamsFromList(dataUseOptions, "data_uses"),
    [dataUseOptions]
  );

  const selectedLegalBasisFilters = useMemo(
    () => getQueryParamsFromList(legalBasisOptions, "legal_bases"),
    [legalBasisOptions]
  );
  const selectedPurposeFilters = useMemo(() => {
    const normalOptions = purposeOptions
      .filter((o) => o.value.includes("normal"))
      .map((o) => ({
        ...o,
        value: o.value.split(".")[1],
      }));
    return getQueryParamsFromList(normalOptions, "purposes");
  }, [purposeOptions]);
  const selectedSpecialPurposeFilters = useMemo(() => {
    const specialOptions = purposeOptions
      .filter((o) => o.value.includes("special"))
      .map((o) => ({
        ...o,
        value: o.value.split(".")[1],
      }));
    return getQueryParamsFromList(specialOptions, "special_purposes");
  }, [purposeOptions]);
  const selectedConsentCategoryFilters = useMemo(
    () => getQueryParamsFromList(consentCategoryOptions, "consent_category"),
    [consentCategoryOptions]
  );

  const {
    PAGE_SIZES,
    pageSize,
    setPageSize,
    onPreviousPageClick,
    isPreviousPageDisabled,
    onNextPageClick,
    isNextPageDisabled,
    startRange,
    endRange,
    pageIndex,
    setTotalPages,
    resetPageIndexToDefault,
  } = useServerSidePagination();

  const [globalFilter, setGlobalFilter] = useState<string>();

  const updateGlobalFilter = (searchTerm: string) => {
    resetPageIndexToDefault();
    setGlobalFilter(searchTerm);
  };

  const {
    isFetching: isReportFetching,
    isLoading: isReportLoading,
    data: vendorReport,
  } = useGetVendorReportQuery({
    pageIndex,
    pageSize,
    dataUses: selectedDataUseFilters,
    search: globalFilter,
    legalBasis: selectedLegalBasisFilters,
    purposes: selectedPurposeFilters,
    specialPurposes: selectedSpecialPurposeFilters,
    consentCategories: selectedConsentCategoryFilters,
  });

  const {
    items: data,
    total: totalRows,
    pages: totalPages,
  } = useMemo(() => vendorReport || emptyVendorReportResponse, [vendorReport]);

  useEffect(() => {
    setTotalPages(totalPages);
  }, [totalPages, setTotalPages]);

  const tcfColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.name, {
        id: "name",
        cell: (props) => <DefaultCell value={props.getValue()} />,
        header: (props) => <DefaultHeaderCell value="Vendor" {...props} />,
        meta: {
          maxWidth: "350px",
        },
      }),
      columnHelper.accessor((row) => row.data_uses, {
        id: "tcf_purpose",
        cell: (props) => (
          <BadgeCell suffix="purposes" value={props.getValue()} />
        ),
        header: (props) => <DefaultHeaderCell value="TCF purpose" {...props} />,
        meta: {
          width: "175px",
        },
      }),
      columnHelper.accessor((row) => row.data_uses, {
        id: "data_uses",
        cell: (props) => (
          <BadgeCell suffix="data uses" value={props.getValue()} />
        ),
        header: (props) => <DefaultHeaderCell value="Data use" {...props} />,
        meta: {
          width: "175px",
        },
      }),
      columnHelper.accessor((row) => row.legal_bases, {
        id: "legal_bases",
        cell: (props) => <BadgeCell suffix="bases" value={props.getValue()} />,
        header: (props) => <DefaultHeaderCell value="Legal basis" {...props} />,
        meta: {
          width: "175px",
        },
      }),
      columnHelper.accessor((row) => row.consent_categories, {
        id: "consent_categories",
        cell: (props) => (
          <BadgeCell suffix="Categories" value={props.getValue()} />
        ),
        header: (props) => <DefaultHeaderCell value="Categories" {...props} />,
        meta: {
          width: "175px",
        },
      }),
      columnHelper.accessor((row) => row.cookies, {
        id: "cookies",
        cell: (props) => (
          <BadgeCell suffix="Cookies" value={props.getValue()} />
        ),
        header: (props) => <DefaultHeaderCell value="Cookies" {...props} />,
        meta: {
          width: "175px",
        },
      }),
    ],
    []
  );

  const tableInstance = useReactTable<SystemSummary>({
    columns: tcfColumns,
    data,
    state: {
      columnVisibility: {
        tcf_purpose: isTcfEnabled,
        data_uses: isTcfEnabled,
        legal_bases: isTcfEnabled,
        consent_categories: !isTcfEnabled,
        cookies: !isTcfEnabled,
      },
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const onRowClick = (system: SystemSummary) => {
    setSystemFidesKey(system.fides_key);
    onRowModalOpen();
  };

  if (isReportLoading || isLoadingHealthCheck) {
    return <TableSkeletonLoader rowHeight={36} numRows={15} />;
  }
  return (
    <Flex flex={1} direction="column" overflow="auto">
      {isRowModalOpen && systemFidesKey ? (
        <ConsentManagementModal
          isOpen={isRowModalOpen}
          fidesKey={systemFidesKey}
          onClose={onRowModalClose}
        />
      ) : null}
      <TableActionBar>
        <GlobalFilterV2
          globalFilter={globalFilter}
          setGlobalFilter={updateGlobalFilter}
          placeholder="Search"
        />
        <ConsentManagementFilterModal
          isOpen={isFilterOpen}
          isTcfEnabled={isTcfEnabled}
          onClose={onCloseFilter}
          resetFilters={resetFilters}
          purposeOptions={purposeOptions}
          onPurposeChange={onPurposeChange}
          dataUseOptions={dataUseOptions}
          onDataUseChange={onDataUseChange}
          legalBasisOptions={legalBasisOptions}
          onLegalBasisChange={onLegalBasisChange}
          consentCategoryOptions={consentCategoryOptions}
          onConsentCategoryChange={onConsentCategoryChange}
        />
        <Flex alignItems="center">
          <Button
            onClick={onOpenFilter}
            data-testid="filter-multiple-systems-btn"
            size="xs"
            variant="outline"
          >
            Filter
          </Button>
        </Flex>
      </TableActionBar>
      <FidesTableV2 tableInstance={tableInstance} onRowClick={onRowClick} />
      <PaginationBar
        totalRows={totalRows}
        pageSizes={PAGE_SIZES}
        setPageSize={setPageSize}
        onPreviousPageClick={onPreviousPageClick}
        isPreviousPageDisabled={isPreviousPageDisabled || isReportFetching}
        onNextPageClick={onNextPageClick}
        isNextPageDisabled={isNextPageDisabled || isReportFetching}
        startRange={startRange}
        endRange={endRange}
      />
    </Flex>
  );
};