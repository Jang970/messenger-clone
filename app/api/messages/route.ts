import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function POST(request: Request) {
  try {
    const currUser = await getCurrentUser();
    const body = await request.json();

    const { message, image, conversationId } = body;

    if (!currUser?.id || !currUser?.email) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const newMessage = await prisma.message.create({
      data: {
        body: message,
        image: image,
        conversation: {
          connect: {
            id: conversationId,
          },
        },
        sender: {
          connect: {
            id: currUser.id,
          },
        },
        seen: {
          connect: {
            id: currUser.id,
          },
        },
      },
      include: {
        seen: true,
        sender: true,
      },
    });

    const updateConversation = await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessageAt: new Date(),
        messages: {
          connect: {
            id: newMessage.id,
          },
        },
      },
      include: {
        users: true,
        messages: {
          include: {
            seen: true,
          },
        },
      },
    });

    return NextResponse.json(newMessage);
  } catch (error: any) {
    console.log(error, "ERROR_MESSAGES");
    return new NextResponse("internal error", { status: 500 });
  }
}
