import { NodeRuntime, NodeServices } from '@effect/platform-node';
import { Array, Console, Data, Effect, FileSystem, Path, Schema, String } from 'effect';
import { Argument, Command } from 'effect/cli';
import { extractText, getDocumentProxy, renderPageAsImage } from 'unpdf';

/** A document opened for reading. */
type Document = Awaited<ReturnType<typeof getDocumentProxy>>;

/** A failure of the library that reads a document. */
class ReadingError extends Data.TaggedError('ReadingError')<{
  /** The failure the library gives. */
  readonly cause: unknown;
}> {
  /** The message the library gives, or a message of its own where the library gives none. */
  override get message(): string {
    return this.cause instanceof Error ? this.cause.message : 'The document cannot be read.';
  }
}

/** A failure on a range of pages that runs backward or outside the pages of a document. */
class PageRangeError extends Data.TaggedError('PageRangeError')<{
  /** The range as the command line gives it. */
  readonly range: string;
  /** The number of pages of the document. */
  readonly totalPages: number;
}> {
  /** The message that names the range and the pages of the document. */
  override get message(): string {
    return `Pages must run from 1 to ${this.totalPages}, given: ${this.range}`;
  }
}

/** The number of pixels drawn for each point of a page. */
const scale = 2;

/** A schema of a page or a range of pages as the command line gives it, such as `84` or `66-95`. */
const PageRange = Schema.String.pipe(Schema.check(Schema.isPattern(/^\d+(-\d+)?$/)));

/** Gives the name of the file of a page, its number padded to the digits of the last page. */
const fileName = (pageNumber: number, totalPages: number, extension: string): string =>
  `page-${String.padStart(`${totalPages}`.length, '0')(`${pageNumber}`)}.${extension}`;

/** Gives a number of pages in words, such as `1 page` or `4 pages`. */
const pagesInWords = (count: number): string => `${count} ${count === 1 ? 'page' : 'pages'}`;

/** Gives the numbers of the pages a range names, from its first page to its last. */
const pagesOf = (
  range: string,
  totalPages: number,
): Effect.Effect<Array.NonEmptyReadonlyArray<number>, PageRangeError> => {
  // The first page and the last page as the range writes them, the first page again where the range names one page.
  const [first, last = first] = String.split('-')(range);
  // The number of the first page.
  const firstPage = Number(first);
  // The number of the last page.
  const lastPage = Number(last);
  return firstPage < 1 || lastPage < firstPage || lastPage > totalPages
    ? Effect.fail(new PageRangeError({ range, totalPages }))
    : Effect.succeed(Array.range(firstPage, lastPage));
};

/** Opens a document from a file for as long as the scope lasts. */
const open = Effect.fn(function* (documentPath: string) {
  // The file system the document is read from.
  const fileSystem = yield* FileSystem.FileSystem;
  // The bytes of the document.
  const data = yield* fileSystem.readFile(documentPath);
  return yield* Effect.acquireRelease(
    Effect.tryPromise({
      try: () => getDocumentProxy(new Uint8Array(data)),
      catch: (cause) => new ReadingError({ cause }),
    }),
    (document) => Effect.promise(() => document.loadingTask.destroy()),
  );
});

/** Writes the text of every page of a document into a directory, one file for each page. */
const writeText = Effect.fn(function* (document: Document, directory: string) {
  // The file system the text is written to.
  const fileSystem = yield* FileSystem.FileSystem;
  // The paths of the files the text is written to.
  const path = yield* Path.Path;
  // The number of pages of the document and the text of each page.
  const { totalPages, text: pageTexts } = yield* Effect.tryPromise({
    try: () => extractText(document, { mergePages: false }),
    catch: (cause) => new ReadingError({ cause }),
  });
  yield* Effect.forEach(
    pageTexts,
    (pageText, index) =>
      fileSystem.writeFileString(
        path.join(directory, fileName(index + 1, totalPages, 'txt')),
        pageText,
      ),
    { concurrency: 'unbounded', discard: true },
  );
  yield* Console.log(`${pagesInWords(totalPages)} written as text into ${directory}`);
});

/** Draws as images into a directory the pages of a document that ranges name, one file for each page. */
const writeImages = Effect.fn(function* (
  document: Document,
  directory: string,
  ranges: ReadonlyArray<string>,
) {
  // The file system the images are written to.
  const fileSystem = yield* FileSystem.FileSystem;
  // The paths of the files the images are written to.
  const path = yield* Path.Path;
  // The number of pages of the document.
  const totalPages = document.numPages;
  // The numbers of the pages the ranges name.
  const pages = Array.flatten(yield* Effect.forEach(ranges, (range) => pagesOf(range, totalPages)));
  yield* Effect.forEach(
    pages,
    (pageNumber) =>
      Effect.tryPromise({
        try: () =>
          renderPageAsImage(document, pageNumber, {
            canvasImport: () => import('@napi-rs/canvas'),
            scale,
          }),
        catch: (cause) => new ReadingError({ cause }),
      }).pipe(
        Effect.flatMap((image) =>
          fileSystem.writeFile(
            path.join(directory, fileName(pageNumber, totalPages, 'png')),
            new Uint8Array(image),
          ),
        ),
      ),
    { concurrency: 'unbounded', discard: true },
  );
  yield* Console.log(`${pagesInWords(pages.length)} written as images into ${directory}`);
});

/** The argument that names the PDF to read. */
const documentArgument = Argument.File('document', { mustExist: true }).pipe(
  Argument.withDescription('The PDF to read'),
);

/** The argument that names the directory the pages are written into. */
const directoryArgument = Argument.String('directory').pipe(
  Argument.withDescription('The directory the pages are written into, made where it is missing'),
);

/** The command that writes the text of every page. */
const text = Command.make(
  'text',
  { document: documentArgument, directory: directoryArgument },
  Effect.fn(function* ({ document: documentPath, directory }) {
    // The file system the directory is made in.
    const fileSystem = yield* FileSystem.FileSystem;
    yield* fileSystem.makeDirectory(directory, { recursive: true });
    yield* writeText(yield* open(documentPath), directory);
  }, Effect.scoped),
).pipe(Command.withDescription('Write the text of every page, one file for each page'));

/** The command that draws pages as images. */
const image = Command.make(
  'image',
  {
    document: documentArgument,
    directory: directoryArgument,
    ranges: Argument.String('ranges').pipe(
      Argument.withSchema(PageRange),
      Argument.withDescription('A page or a range of pages, such as 84 or 66-95'),
      Argument.variadic({ min: 1 }),
    ),
  },
  Effect.fn(function* ({ document: documentPath, directory, ranges }) {
    // The file system the directory is made in.
    const fileSystem = yield* FileSystem.FileSystem;
    yield* fileSystem.makeDirectory(directory, { recursive: true });
    yield* writeImages(yield* open(documentPath), directory, ranges);
  }, Effect.scoped),
).pipe(Command.withDescription('Draw pages as images, one file for each page'));

/** The program that runs the command the command line names. */
const program = Command.make('reader').pipe(
  Command.withDescription('Write the pages of a document as text and images'),
  Command.withSubcommands([text, image]),
  Command.run({ version: '0.0.0' }),
);

// Layers provided here, at the entry point of the reader.
// @effect-diagnostics-next-line strictEffectProvide:off
NodeRuntime.runMain(program.pipe(Effect.provide(NodeServices.layer)));
