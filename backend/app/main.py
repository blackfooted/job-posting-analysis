from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.app.config_loader import ConfigLoadError, load_all_configs
from backend.app.database import initialize_database
from backend.app.postings import error_response, router as postings_router
from backend.app.review_items import router as review_items_router


app = FastAPI(title="Job Posting Analysis API")


@app.on_event("startup")
def startup() -> None:
    initialize_database()
    load_all_configs()


@app.exception_handler(HTTPException)
def http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> JSONResponse:
    del request
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response("HTTP_ERROR", str(exc.detail)),
    )


@app.exception_handler(RequestValidationError)
def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    del request
    return JSONResponse(
        status_code=422,
        content=error_response("VALIDATION_ERROR", str(exc)),
    )


@app.exception_handler(ConfigLoadError)
def config_exception_handler(
    request: Request,
    exc: ConfigLoadError,
) -> JSONResponse:
    del request
    return JSONResponse(
        status_code=500,
        content=error_response("CONFIG_LOAD_ERROR", str(exc)),
    )


app.include_router(postings_router)
app.include_router(review_items_router)
