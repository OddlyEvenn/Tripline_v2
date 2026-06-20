/**
 * Emulates the Spring Data Page object structure expected by the React frontend
 */
function makePageResponse(content, totalElements, page, size) {
  const totalPages = totalElements > 0 ? Math.ceil(totalElements / size) : 0;
  return {
    content,
    totalPages,
    totalElements,
    size,
    number: page,
    numberOfElements: content.length,
    first: page === 0,
    last: page >= totalPages - 1,
    empty: content.length === 0
  };
}

module.exports = {
  makePageResponse
};
