import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { graphql } from "react-relay";

import {
  useSubscription,
  withFragmentContainer,
} from "coral-framework/lib/relay";
import { GQLCOMMENT_SORT } from "coral-framework/schema";
import { Flex } from "coral-ui/components/v2";

import { LiveCommentRepliesContainer_comment } from "coral-stream/__generated__/LiveCommentRepliesContainer_comment.graphql";
import { LiveCommentRepliesContainerAfterCommentEdge } from "coral-stream/__generated__/LiveCommentRepliesContainerAfterCommentEdge.graphql";
import { LiveCommentRepliesContainerBeforeCommentEdge } from "coral-stream/__generated__/LiveCommentRepliesContainerBeforeCommentEdge.graphql";

import LiveCommentBody from "../../LiveComment/LiveCommentBody";
import LiveReplyCommentEnteredSubscription from "./LiveReplyCommentEnteredSubscription";

import styles from "./LiveCommentRepliesContainer.css";

interface Props {
  beforeComments: LiveCommentRepliesContainerBeforeCommentEdge;
  beforeHasMore: boolean;
  loadMoreBefore: () => Promise<void>;
  isLoadingMoreBefore: boolean;

  afterComments: LiveCommentRepliesContainerAfterCommentEdge;
  afterHasMore: boolean;
  loadMoreAfter: () => Promise<void>;
  isLoadingMoreAfter: boolean;

  storyID: string;
  comment: LiveCommentRepliesContainer_comment;
}

const LiveCommentRepliesContainer: FunctionComponent<Props> = ({
  beforeComments,
  beforeHasMore,
  loadMoreBefore,
  isLoadingMoreBefore,
  afterComments,
  afterHasMore,
  loadMoreAfter,
  isLoadingMoreAfter,
  storyID,
  comment,
}) => {
  const subscribeToCommentEntered = useSubscription(
    LiveReplyCommentEnteredSubscription
  );
  useEffect(() => {
    const disposable = subscribeToCommentEntered({
      storyID,
      orderBy: GQLCOMMENT_SORT.CREATED_AT_ASC,
      connectionKey: "Replies_after",
      parentID: comment.id,
    });

    return () => {
      disposable.dispose();
    };
  }, [storyID, comment.id, subscribeToCommentEntered]);

  const repliesRef = useRef<any | null>(null);

  const onScroll = useCallback(async () => {
    const replies = repliesRef.current;
    if (!replies) {
      return;
    }

    const atBottom =
      Math.abs(
        replies.scrollTop - (replies.scrollHeight - replies.offsetHeight)
      ) < 5;

    const atTop = replies.scrollTop < 5;

    if (atTop && beforeHasMore && !isLoadingMoreBefore && !isLoadingMoreAfter) {
      try {
        await loadMoreBefore();
      } catch (err) {
        // ignore for now
      }
    }
    if (
      atBottom &&
      afterHasMore &&
      !isLoadingMoreAfter &&
      !isLoadingMoreBefore
    ) {
      try {
        await loadMoreAfter();
      } catch (err) {
        // ignore for now
      }
    }
  }, [
    afterHasMore,
    beforeHasMore,
    isLoadingMoreAfter,
    isLoadingMoreBefore,
    loadMoreAfter,
    loadMoreBefore,
  ]);

  return (
    <>
      <div className={styles.comment}>
        <LiveCommentBody
          author={comment.author}
          body={comment.body}
          createdAt={comment.createdAt}
        />
      </div>
      <div onScroll={onScroll} className={styles.replies} ref={repliesRef}>
        {beforeComments.map((e) => {
          return (
            <div key={`chat-reply-${e.node.id}`} className={styles.comment}>
              <Flex justifyContent="flex-start" alignItems="stretch">
                <div className={styles.replyMarker}></div>
                <LiveCommentBody
                  author={e.node.author}
                  body={e.node.body}
                  createdAt={e.node.createdAt}
                />
              </Flex>
            </div>
          );
        })}
        {afterComments.map((e) => {
          return (
            <div key={`chat-reply-${e.node.id}`} className={styles.comment}>
              <Flex justifyContent="flex-start" alignItems="stretch">
                <div className={styles.replyMarker}></div>
                <LiveCommentBody
                  author={e.node.author}
                  body={e.node.body}
                  createdAt={e.node.createdAt}
                />
              </Flex>
            </div>
          );
        })}
      </div>
    </>
  );
};

const enhanced = withFragmentContainer<Props>({
  beforeComments: graphql`
    fragment LiveCommentRepliesContainerBeforeCommentEdge on CommentEdge
      @relay(plural: true) {
      cursor
      node {
        id
        body
        createdAt
        author {
          username
        }
      }
    }
  `,
  afterComments: graphql`
    fragment LiveCommentRepliesContainerAfterCommentEdge on CommentEdge
      @relay(plural: true) {
      cursor
      node {
        id
        body
        createdAt
        author {
          username
        }
      }
    }
  `,
  comment: graphql`
    fragment LiveCommentRepliesContainer_comment on Comment {
      id
      body
      createdAt
      author {
        username
      }
    }
  `,
})(LiveCommentRepliesContainer);

export default enhanced;
