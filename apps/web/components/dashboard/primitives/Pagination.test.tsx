import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Pagination } from "./Pagination"

afterEach(cleanup)

describe("Pagination — pages mode (default)", () => {
    it("renders the summary and the page indicator", () => {
        render(<Pagination summary="12 sur 2 408 · 0 sélectionné" page="1 / 201" />)
        expect(screen.getByText("12 sur 2 408 · 0 sélectionné")).toBeInTheDocument()
        expect(screen.getByText("1 / 201")).toBeInTheDocument()
    })

    it("fires onPrev / onNext when the arrows are clicked", () => {
        const onPrev = vi.fn()
        const onNext = vi.fn()
        render(<Pagination summary="s" page="2 / 9" onPrev={onPrev} onNext={onNext} />)
        fireEvent.click(screen.getByRole("button", { name: "Page précédente" }))
        fireEvent.click(screen.getByRole("button", { name: "Page suivante" }))
        expect(onPrev).toHaveBeenCalledTimes(1)
        expect(onNext).toHaveBeenCalledTimes(1)
    })

    it("disables the arrows at the bounds", () => {
        render(<Pagination summary="s" page="1 / 1" prevDisabled nextDisabled />)
        expect(screen.getByRole("button", { name: "Page précédente" })).toBeDisabled()
        expect(screen.getByRole("button", { name: "Page suivante" })).toBeDisabled()
    })
})

describe("Pagination — loadMore mode", () => {
    it("renders the button and fires onLoadMore when there is more", () => {
        const onLoadMore = vi.fn()
        render(<Pagination mode="loadMore" hasMore onLoadMore={onLoadMore} label="Charger plus de contacts" />)
        const btn = screen.getByRole("button", { name: "Charger plus de contacts" })
        fireEvent.click(btn)
        expect(onLoadMore).toHaveBeenCalledTimes(1)
    })

    it("shows the loading label and disables the button while loading", () => {
        render(<Pagination mode="loadMore" hasMore loading onLoadMore={() => {}} />)
        const btn = screen.getByRole("button", { name: "Chargement…" })
        expect(btn).toBeDisabled()
    })

    it("renders nothing when there is nothing more and no summary", () => {
        const { container } = render(<Pagination mode="loadMore" hasMore={false} />)
        expect(container).toBeEmptyDOMElement()
    })

    it("keeps the summary (and hides the button) when nothing more remains", () => {
        render(<Pagination mode="loadMore" hasMore={false} summary="60 sur 60" />)
        expect(screen.getByText("60 sur 60")).toBeInTheDocument()
        expect(screen.queryByRole("button")).toBeNull()
    })
})
