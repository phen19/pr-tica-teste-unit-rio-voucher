import { jest } from "@jest/globals";

import voucherService from "./../../src/services/voucherService";
import voucherRepository from "./../../src/repositories/voucherRepository";

jest.mock("./../../src/repositories/voucherRepository");

describe("Teste de voucher services", () => {
  it("deveria criar o voucher", async () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {});
    jest
      .spyOn(voucherRepository, "createVoucher")
      .mockImplementationOnce((): any => {});

    await expect(
      voucherService.createVoucher("MOCKARTUDINHO", 70)
    ).resolves.not.toThrow();
    expect(voucherRepository.getVoucherByCode).toBeCalled();
  });

  it("deveria dar erro de conflito", async () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return {
          code: "MOCKARTUDINHO",
          discount: 70,
        };
      });

    const result = voucherService.createVoucher("MOCKARTUDINHO", 70);
    expect(result).rejects.toEqual({
      message: "Voucher already exist.",
      type: "conflict",
    });
  });

  it("aplicando o desconto", async () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return {
          id: 1,
          code: "MOCKARTUDINHO",
          discount: 70,
          used: false,
        };
      });
    jest
      .spyOn(voucherRepository, "useVoucher")
      .mockImplementationOnce((): any => {});

    const amount = 1000;
    const order = await voucherService.applyVoucher("MOCKARTUDINHO", amount);
    expect(order.amount).toBe(amount);
    expect(order.discount).toBe(70);
    expect(order.finalAmount).toBe(amount - amount * (70 / 100));
  });

  it("sem aplicar desconto para balores abaixo de 100", async () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return {
          id: 1,
          code: "MOCKARTUDINHO",
          discount: 70,
          used: false,
        };
      });
    jest
      .spyOn(voucherRepository, "useVoucher")
      .mockImplementationOnce((): any => {});

    const amount = 99;
    const order = await voucherService.applyVoucher("MOCKARTUDINHO", amount);
    expect(order.amount).toBe(amount);
    expect(order.discount).toBe(70);
    expect(order.finalAmount).toBe(amount);
  });

  it("não aplicar desconto para voucher usado", async () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return {
          id: 1,
          code: "MOCKARTUDINHO",
          discount: 70,
          used: true,
        };
      });

    const amount = 1000;
    const order = await voucherService.applyVoucher("MOCKARTUDINHO", amount);
    expect(order.amount).toBe(amount);
    expect(order.discount).toBe(70);
    expect(order.finalAmount).toBe(amount);
    expect(order.applied).toBe(false);
  });

  it("não aplicar desconto para voucher invalido", async () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return undefined;
      });

    const amount = 1000;
    const promise = voucherService.applyVoucher("MOCKARTUDINHO", amount);
    expect(promise).rejects.toEqual({
      message: "Voucher does not exist.",
      type: "conflict",
    });
  });
});
